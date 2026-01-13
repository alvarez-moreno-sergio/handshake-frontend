import { expect, it } from "vitest";
import type { ApiSafeHand, Hand } from "../../components/HandComponent";
import { exportPublicKey, generateRSAKeys, generateRSASigningKeys } from "../../crypto/rsa";
import { CHUNK_SIZE, handleSendFile, handleIncomingFile } from "../../crypto/secureFileTransfer";
import { encryptAndSignPayload } from "../../crypto/hybrid-signed";
import { encodeTransport, type FileMetadataMessage } from "../../crypto/transport-codec";
import { Token } from "@mui/icons-material";

const content = new Uint8Array(512 * 1024); // 2 chunks
const file = new File([content], "test.bin");

const fromUuid = crypto.randomUUID();
const toUuid = crypto.randomUUID();
const fromKeyPair = await generateRSAKeys();
const fromKeySignPair = await generateRSASigningKeys();
const toKeyPair = await generateRSAKeys();
const toKeySignPair = await generateRSASigningKeys();

const fromHand: Hand = {
    key: fromUuid,
    uuid: fromUuid,
    name: "Alice",
    avatarUrl: "undefined",
    keyPair: fromKeyPair,
    signKeyPair: fromKeySignPair,
    publicKey: fromKeyPair.publicKey,
    publicSignKey: fromKeySignPair.publicKey
};

const fromApiSafeHand: ApiSafeHand = {
    key: fromUuid,
    uuid: fromUuid,
    name: "Alice",
    avatarUrl: "undefined",
    publicKey: await exportPublicKey(fromKeyPair.publicKey),
    publicSignKey: await exportPublicKey(fromKeySignPair.publicKey)
};

const toHand: Hand = {
    key: toUuid,
    uuid: toUuid,
    name: "Bob",
    avatarUrl: "undefined",
    keyPair: toKeyPair,
    signKeyPair: toKeySignPair,
    publicKey: toKeyPair.publicKey,
    publicSignKey: toKeySignPair.publicKey
};

const toApiSafeHand: ApiSafeHand = {
    key: toUuid,
    uuid: toUuid,
    name: "Bob",
    avatarUrl: "undefined",
    publicKey: await exportPublicKey(toKeyPair.publicKey),
    publicSignKey: await exportPublicKey(toKeySignPair.publicKey)
};

class MockWebSocket {
    sent: string[] = [];
    readyState = WebSocket.OPEN | WebSocket.CLOSED;
    bufferedAmount = 0;

    send(data: string) {
        this.sent.push(data);
    }
}

it("sends metadata, chunks, and completion in order", async () => {
    const ws = new MockWebSocket();
    ws.readyState = WebSocket.OPEN;

    await handleSendFile(file, fromHand, toApiSafeHand, ws as unknown as WebSocket);

    expect(ws.sent.length).toBe(1 + 2 + 1);

    const metadata = JSON.parse(ws.sent[0]);
    expect(metadata.metadata.type).toBe("file_metadata");

    const chunk1 = JSON.parse(ws.sent[1]);
    expect(chunk1.chunk.chunkIndex).toBe(0);

    const chunk2 = JSON.parse(ws.sent[2]);
    expect(chunk2.chunk.chunkIndex).toBe(1);

    const complete = JSON.parse(ws.sent.at(-1)!);
    expect(complete.complete.type).toBe("file_complete");
});

it("does nothing if ws is not open", async () => {
    const ws = new MockWebSocket();
    ws.readyState = WebSocket.CLOSED;

    await handleSendFile(file, fromHand, toApiSafeHand, ws as unknown as WebSocket);

    expect(ws.sent.length).toBe(0);
});

it("splits file into correct number of chunks", async () => {
    const ws = new MockWebSocket();
    ws.readyState = WebSocket.OPEN;

    await handleSendFile(file, fromHand, toApiSafeHand, ws as unknown as WebSocket);

    const chunks = ws.sent.filter(m =>
        JSON.parse(m).chunk?.type === "file_chunk"
    );

    expect(chunks.length).toBe(Math.ceil(file.size / CHUNK_SIZE));
});

it("reassembles file from metadata + chunks + complete", async () => {
    const fileId = crypto.randomUUID();

    const metadata: FileMetadataMessage = {
        type: "file_metadata",
        from: fromHand.uuid!,
        to: toApiSafeHand.uuid!,
        fileId,
        fileSize: 6,
        totalChunks: 2
    };

    const chunk1 = "foo";
    const chunk2 = "bar";

    const encryptedChunk1 = await encryptAndSignPayload(
        chunk1,
        toApiSafeHand.publicKey,
        fromHand.signKeyPair?.privateKey
    );
    const encryptedChunk2 = await encryptAndSignPayload(
        chunk2,
        toApiSafeHand.publicKey,
        fromHand.signKeyPair?.privateKey
    );

    await handleIncomingFile(metadata, fromApiSafeHand, toHand);

    await handleIncomingFile(
        {
            type: "file_chunk",
            from: fromApiSafeHand.uuid!,
            to: toHand.uuid!,
            fileId,
            chunkIndex: 0,
            payload: encodeTransport(encryptedChunk1)
        },
        fromApiSafeHand,
        toHand
    );

    await handleIncomingFile(
        {
            type: "file_chunk",
            from: fromApiSafeHand.uuid!,
            to: toHand.uuid!,
            fileId,
            chunkIndex: 1,
            payload: encodeTransport(encryptedChunk2)
        },
        fromApiSafeHand,
        toHand
    );

    const result = await handleIncomingFile(
        {
            type: "file_complete",
            from: fromApiSafeHand.uuid!,
            to: toHand.uuid!,
            fileId
        },
        fromApiSafeHand,
        toHand
    );

    const text = new TextDecoder().decode(result!);
    expect(text).toBe("foobar");
});