import { type SignedEncryptedPayload } from "./hybrid-signed";

export interface TransportSignedEncryptedPayload {
  encryptedPayload: {
    encryptedAESKey: string;
    encryptedAESPayload: {
      iv: number[];
      cipherText: string;
    };
  };
  signature: string;
}

/* ===========================
   ENCODE (Crypto → Transport)
   =========================== */

export function encodeTransport(
  payload: SignedEncryptedPayload
): TransportSignedEncryptedPayload {
  return {
    encryptedPayload: {
      encryptedAESKey: bufferToBase64(
        toArrayBuffer(payload.encryptedPayload.encryptedAESKey)
      ),
      encryptedAESPayload: {
        iv: Array.from(
          new Uint8Array(
            toArrayBuffer(payload.encryptedPayload.encryptedAESPayload.iv)
          )
        ),
        cipherText: bufferToBase64(
          toArrayBuffer(payload.encryptedPayload.encryptedAESPayload.cipherText)
        ),
      },
    },
    signature: bufferToBase64(toArrayBuffer(payload.signature)),
  };
}

/* ===========================
   DECODE (Transport → Crypto)
   =========================== */

export function decodeTransport(
  payload: TransportSignedEncryptedPayload
): SignedEncryptedPayload {
  return {
    encryptedPayload: {
      encryptedAESKey: base64ToBuffer(payload.encryptedPayload.encryptedAESKey),
      encryptedAESPayload: {
        iv: new Uint8Array(
          payload.encryptedPayload.encryptedAESPayload.iv
        ).buffer,
        cipherText: base64ToBuffer(
          payload.encryptedPayload.encryptedAESPayload.cipherText
        ),
      },
    },
    signature: base64ToBuffer(payload.signature),
  };
}

/* ===========================
   Helpers
   =========================== */

export function ArrayBufferSignatureToBase64(signature: ArrayBuffer): string {
  return bufferToBase64(signature);
}

function toArrayBuffer(src: BufferSource): ArrayBuffer {
  return src instanceof ArrayBuffer ? src : src.buffer;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
