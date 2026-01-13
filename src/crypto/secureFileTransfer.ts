import type { ApiSafeHand, Hand } from "../components/HandComponent";

import { encryptAndSignPayload, verifyAndDecrypt, type SignedEncryptedPayload } from "./hybrid-signed";

import { encodeTransport, type FileMetadataMessage, type FileChunkMessage, type FileCompleteMessage, type IncomingFileMessage, decodeTransport, type Transport } from "./transport-codec";

import { arrayBufferToBase64, base64ToArrayBuffer } from "../helpers/buffer";

export const CHUNK_SIZE = 256 * 1024;
const MAX_CHUNKS = 2048;

export async function handleSendFile(
    file: File,
    fromHand: Hand,
    toApiSafeHand: ApiSafeHand,
    ws: WebSocket
) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!file || !fromHand.uuid || !toApiSafeHand.uuid) return;

    const fileId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    sendFileMetadata(
        fromHand.uuid,
        toApiSafeHand.uuid,
        fileId,
        file,
        totalChunks,
        ws
    );

    await sendFile(
        fromHand,
        toApiSafeHand,
        fileId,
        file,
        ws
    );
    return fileId;
}

function sendFileMetadata(
    from: string,
    to: string,
    fileId: string,
    file: File,
    totalChunks: number,
    ws: WebSocket
) {
    const metadata: FileMetadataMessage = {
        type: "file_metadata",
        from,
        to,
        fileId,
        fileSize: file.size,
        totalChunks
    };
    ws.send(JSON.stringify(metadata));
}

async function sendFile(
    fromHand: Hand,
    toApiSafeHand: ApiSafeHand,
    fileId: string,
    file: File,
    transport: Transport
) {
    let offset: number = 0;
    let chunkIndex: number = 0;

    while (offset < file.size){
        const slice: Blob = file.slice(offset, offset + CHUNK_SIZE);
        const buffer: ArrayBuffer = await slice.arrayBuffer();
        const bufferBase64 = arrayBufferToBase64(buffer);
        const encryptedChunk: SignedEncryptedPayload = await encryptAndSignPayload(
            bufferBase64,
            toApiSafeHand.publicKey,
            fromHand.signKeyPair?.privateKey
        );

        const chunk: FileChunkMessage = {
            type: "file_chunk",
            from: fromHand.uuid!,
            to: toApiSafeHand.uuid!,
            fileId,
            chunkIndex,
            payload: encodeTransport(encryptedChunk)
        };

        while (transport.bufferedAmount > CHUNK_SIZE) {
            await waitUntilZeroedBufferedAmount(transport);
        }

        transport.send(JSON.stringify(chunk));

        offset += CHUNK_SIZE;
        chunkIndex++;
    }

    const complete: FileCompleteMessage = {
        type: "file_complete",
        from: fromHand.uuid!,
        to: toApiSafeHand.uuid!,
        fileId
    }
    transport.send(JSON.stringify(complete));
}

async function waitUntilZeroedBufferedAmount(transport: Transport){
    while (transport.bufferedAmount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

const queue: Map<string, IncomingFileMessage[]> = new Map();
const rejectedFiles: string[] = [];
const incomingMetadatas: Map<string, FileMetadataMessage> = new Map();
const incomingFiles: Map<string, Map<number, ArrayBuffer>> = new Map();

export async function enqueueIncomingFile(
    msg: IncomingFileMessage,
    fromApiSafeHand: ApiSafeHand,
    toHand: Hand
): Promise<Uint8Array | null> {
    if (!queue.get(msg.fileId)) {
        queue.set(msg.fileId, []);
    }

    queue.get(msg.fileId)!.push(msg);

    // Only process once metadata exists
    const fileQueue = queue.get(msg.fileId)!;
    const metadataMsg = fileQueue.find(e => e.type === "file_metadata") as FileMetadataMessage | undefined;
    if (!metadataMsg) return null;

    // Only process chunks when we have all of them
    const chunks = fileQueue.filter(e => e.type === "file_chunk");
    if (chunks.length < metadataMsg.totalChunks) return null;

    // If file_complete exists, finalize
    const completeMsg = fileQueue.find(e => e.type === "file_complete");
    if (!completeMsg) return null;

    // Process each message in order
    for (const m of fileQueue) {
        await handleIncomingFile(m, fromApiSafeHand, toHand);
    }

    // Remove from queue
    queue.delete(msg.fileId);

    // Return reassembled file
    return finalizeTransfer(msg.fileId) || null;
}


async function handleIncomingFile(
    msg: IncomingFileMessage,
    fromApiSafeHand: ApiSafeHand,
    toHand: Hand
): Promise<void | Uint8Array<ArrayBufferLike>> {
    if (!msg || !fromApiSafeHand || !toHand) return;

    if (msg.type === "file_metadata") {
        if (!validateMetadata(msg)) return;
    }
    else if (msg.type === "file_chunk") {
        if (
            !incomingMetadatas.get(msg.fileId)
            || !msg.payload
        ) {
            return;
        }

        const chunkBase64: string = await verifyAndDecrypt(
            decodeTransport(msg.payload),
            toHand.keyPair?.privateKey,
            fromApiSafeHand.publicSignKey
        );
        const chunk = base64ToArrayBuffer(chunkBase64);
        storeChunk(msg.fileId, msg.chunkIndex, chunk);
    }
    else if (msg.type === "file_complete") {
        return;
    }
}

function validateMetadata(msg: FileMetadataMessage): boolean {
    if (
        !/^[a-f0-9-]{36}$/.test(msg.fileId)
        || !Number.isInteger(msg.fileSize)
        || msg.fileSize > CHUNK_SIZE * MAX_CHUNKS
        || !Number.isInteger(msg.totalChunks)
        || msg.totalChunks <= 0
        || msg.totalChunks > MAX_CHUNKS
    ) {
        rejectedFiles.push(msg.fileId);
        return false;
    }
    incomingMetadatas.set(msg.fileId, msg);
    return true;
}

function storeChunk(
    fileId: string,
    chunkIndex: number,
    chunk: ArrayBuffer
) {
    if (!incomingFiles.get(fileId)) {
        incomingFiles.set(fileId, new Map<number, ArrayBuffer>());
    }
    
    incomingFiles.get(fileId)?.set(chunkIndex, chunk);
}

function finalizeTransfer(fileId: string) {
    const metadata: FileMetadataMessage | undefined = incomingMetadatas.get(fileId);
    const chunks: Map<number, ArrayBuffer> | undefined = incomingFiles.get(fileId);

    if (!metadata || !chunks) return;

    if (chunks.size !== metadata.totalChunks) {
        console.log("Incomplete file: ", fileId);
        return;
    }

    return reassemble(fileId, metadata.fileSize, chunks);
}

function reassemble(
    fileId: string,
    fileSize: number,
    chunks: Map<number, ArrayBuffer>
): Uint8Array {
    const buffers = Array.from(chunks.entries())
        .sort(([i], [j]) => i - j)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(([_, buf]) => buf);
    
    const fileBuffer: Uint8Array = new Uint8Array(fileSize);
    let offset = 0;
    for (const buf of buffers) {
        fileBuffer.set(new Uint8Array(buf), offset);
        offset += buf.byteLength;
    }

    incomingMetadatas.delete(fileId);
    incomingFiles.delete(fileId);

    return fileBuffer;
}