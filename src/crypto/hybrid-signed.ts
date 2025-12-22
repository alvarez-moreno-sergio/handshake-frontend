import type {EncryptedPayload} from './hybrid';
import {hybridEncryptPayload, hybridDecryptPayload} from './hybrid';
import {signData, verifySignature, importPublicKey, importSigningPublicKey} from './rsa';

export interface SignedEncryptedPayload {
    encryptedPayload: EncryptedPayload;
    signature: ArrayBuffer;
}

export async function encryptAndSignPayload(
    message: string,
    receiverRSAPublicKeyString: string | null | undefined,
    senderRSAPrivateSigningKey: CryptoKey | null | undefined
): Promise<SignedEncryptedPayload> {
    if (!receiverRSAPublicKeyString || !senderRSAPrivateSigningKey) {
        throw new Error('Invalid keys provided for encryption/signing');
    }
    const receiverRSAPublicKey = await importPublicKey(receiverRSAPublicKeyString);
    const encryptedPayload = await hybridEncryptPayload(message, receiverRSAPublicKey);
    const serializedPayload = serializeForSigning(encryptedPayload);
    const signature = await signData(serializedPayload, senderRSAPrivateSigningKey);
    
    return { encryptedPayload, signature };
}

export async function verifyAndDecrypt(
    signedEncryptedPayload: SignedEncryptedPayload,
    receiverRSAPrivateKey: CryptoKey | null | undefined,
    senderRSAPublicSigningKeyString: string | null | undefined
): Promise<string> {
    if (!receiverRSAPrivateKey || !senderRSAPublicSigningKeyString) {
        throw new Error('Invalid keys provided for decryption/verification');
    }
    const senderRSAPublicSigningKey = await importSigningPublicKey(senderRSAPublicSigningKeyString);
    const serialized = serializeForSigning(signedEncryptedPayload.encryptedPayload);

    const valid = await verifySignature(serialized, signedEncryptedPayload.signature, senderRSAPublicSigningKey);
    if (!valid) throw new Error('Signature verification failed');

    return hybridDecryptPayload(signedEncryptedPayload.encryptedPayload, receiverRSAPrivateKey);
}

function serializeForSigning(payload: EncryptedPayload): string {
  return JSON.stringify({
    encryptedAESKey: Array.from(
      new Uint8Array(payload.encryptedAESKey)
    ),
    encryptedAESPayload: {
      iv: Array.from(
        new Uint8Array(bufferSourceToArrayBuffer(payload.encryptedAESPayload.iv))
      ),
      cipherText: Array.from(
        new Uint8Array(payload.encryptedAESPayload.cipherText)
      ),
    },
  });
}

function bufferSourceToArrayBuffer(src: BufferSource): ArrayBuffer {
  if (src instanceof ArrayBuffer) {
    return src;
  }
  return src.buffer.slice(
    src.byteOffset,
    src.byteOffset + src.byteLength
  );
}
