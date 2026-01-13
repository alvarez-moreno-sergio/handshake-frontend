import { type SignedEncryptedPayload } from "./hybrid-signed";

import { arrayBufferToBase64, base64ToArrayBuffer, bufferSourceToArrayBuffer } from "../helpers/buffer";

export interface TransportSignedEncryptedPayload {
  encryptedPayload: {
    encryptedAESKey: string;
    encryptedAESPayload: {
      iv: number[];
      cipherText: string;
    };
  };
  signature: string;
};

export function encodeTransport(
  payload: SignedEncryptedPayload
): TransportSignedEncryptedPayload {
  return {
    encryptedPayload: {
      encryptedAESKey: arrayBufferToBase64(
        bufferSourceToArrayBuffer(payload.encryptedPayload.encryptedAESKey)
      ),
      encryptedAESPayload: {
        iv: Array.from(
          new Uint8Array(
            bufferSourceToArrayBuffer(payload.encryptedPayload.encryptedAESPayload.iv)
          )
        ),
        cipherText: arrayBufferToBase64(
          bufferSourceToArrayBuffer(payload.encryptedPayload.encryptedAESPayload.cipherText)
        ),
      },
    },
    signature: arrayBufferToBase64(bufferSourceToArrayBuffer(payload.signature)),
  };
}

export function decodeTransport(
  payload: TransportSignedEncryptedPayload
): SignedEncryptedPayload {
  return {
    encryptedPayload: {
      encryptedAESKey: base64ToArrayBuffer(payload.encryptedPayload.encryptedAESKey),
      encryptedAESPayload: {
        iv: new Uint8Array(
          payload.encryptedPayload.encryptedAESPayload.iv
        ).buffer,
        cipherText: base64ToArrayBuffer(
          payload.encryptedPayload.encryptedAESPayload.cipherText
        ),
      },
    },
    signature: base64ToArrayBuffer(payload.signature),
  };
}

export interface Transport {
  send(data: string): void;
  readonly bufferedAmount: number;
}

export type FileMetadataMessage = {
  type: "file_metadata";
  from: string;
  to: string;
  fileId: string;
  fileSize: number;
  totalChunks: number;
};

export type FileChunkMessage = {
  type: "file_chunk";
  from: string;
  to: string;
  fileId: string;
  chunkIndex: number;
  payload: TransportSignedEncryptedPayload;
};

export type FileCompleteMessage = {
  type: "file_complete";
  from: string;
  to: string;
  fileId: string;
};

export type IncomingFileMessage = 
  | FileMetadataMessage
  | FileChunkMessage
  | FileCompleteMessage;