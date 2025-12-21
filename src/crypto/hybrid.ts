import { generateAESKey, encryptAES, decryptAES } from './aes';
import { encryptRSA, decryptRSA } from './rsa';

export interface EncryptedPayload {
    encryptedAESKey: ArrayBuffer;
    encryptedAESPayload: {
        iv: BufferSource;
        cipherText: ArrayBuffer;
    };
}

export async function hybridEncryptPayload(
    message: string,
    receiverRSAPublicKey: CryptoKey
): Promise<EncryptedPayload> {
    const aesKey = await generateAESKey();
    const encryptedAESPayload = await encryptAES(message, aesKey);
    const rawAESKey = await crypto.subtle.exportKey('raw', aesKey);
    const encryptedAESKey = await encryptRSA(rawAESKey, receiverRSAPublicKey);

    return { encryptedAESKey, encryptedAESPayload };
}

export async function hybridDecryptPayload(
    payload: EncryptedPayload,
    receiverRSAPrivateKey: CryptoKey
): Promise<string> {
    const rawAESKey = await decryptRSA(payload.encryptedAESKey, receiverRSAPrivateKey);
    const aesKey = await crypto.subtle.importKey(
        'raw',
        typeof rawAESKey === 'string' ? new TextEncoder().encode(rawAESKey) : rawAESKey,
        { name: 'AES-GCM' },
        true,
        ['decrypt']
    );
    const decryptedMessage = await decryptAES(
        payload.encryptedAESPayload.cipherText,
        aesKey,
        payload.encryptedAESPayload.iv
    );

    return decryptedMessage;
}
