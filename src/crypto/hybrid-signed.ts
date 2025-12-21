import type {EncryptedPayload} from './hybrid';
import {hybridEncryptPayload, hybridDecryptPayload} from './hybrid';
import {signData, verifySignature} from './rsa';

export interface SignedEncryptedPayload {
    encryptedPayload: EncryptedPayload;
    signature: ArrayBuffer;
}

export async function encryptAndSignPayload(
    message: string,
    receiverRSAPublicKey: CryptoKey,
    senderRSAPrivateSigningKey: CryptoKey
): Promise<SignedEncryptedPayload> {
    const encryptedPayload = await hybridEncryptPayload(message, receiverRSAPublicKey);
    const serializedPayload = JSON.stringify({
        encryptedAESKey: Array.from(new Uint8Array(encryptedPayload.encryptedAESKey)),
        encryptedAESPayload: {
            iv: encryptedPayload.encryptedAESPayload.iv,
            cipherText: Array.from(new Uint8Array(encryptedPayload.encryptedAESPayload.cipherText)),
        },
    });
    const signature = await signData(serializedPayload, senderRSAPrivateSigningKey);
    
    return { encryptedPayload, signature };
}

export async function verifyAndDecrypt(
    signedEncryptedPayload: SignedEncryptedPayload,
    receiverRSAPrivateKey: CryptoKey,
    senderRSAPublicSigningKey: CryptoKey
): Promise<string> {
    const serialized = JSON.stringify({
        encryptedAESKey: Array.from(new Uint8Array(signedEncryptedPayload.encryptedPayload.encryptedAESKey)),
        encryptedAESPayload: {
            iv: signedEncryptedPayload.encryptedPayload.encryptedAESPayload.iv,
            cipherText: Array.from(new Uint8Array(signedEncryptedPayload.encryptedPayload.encryptedAESPayload.cipherText)),
        }
    });

    const valid = await verifySignature(serialized, signedEncryptedPayload.signature, senderRSAPublicSigningKey);
    if (!valid) throw new Error('Signature verification failed');

    return hybridDecryptPayload(signedEncryptedPayload.encryptedPayload, receiverRSAPrivateKey);
}
