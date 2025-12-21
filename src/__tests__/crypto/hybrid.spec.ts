import { describe, it, expect } from 'vitest';
import { generateRSAKeys } from '../../crypto/rsa';
import { hybridEncryptPayload, hybridDecryptPayload } from '../../crypto/hybrid';

describe('Hybrid Encryption', () => {

    it('should encrypt and decrypt message correctly', async () => {
        const bobKeys = await generateRSAKeys();
        const message = 'Hello Bob, this is Alice!';

        const payload = await hybridEncryptPayload(message, bobKeys.publicKey);
        const decrypted = await hybridDecryptPayload(payload, bobKeys.privateKey);

        expect(decrypted).toBe(message);
    });

    it('should fail decryption if AES key is tampered', async () => {
        const bobKeys = await generateRSAKeys();
        const message = 'Hello Bob! This is Alice.';

        const payload = await hybridEncryptPayload(message, bobKeys.publicKey);

        const tamperedKey = new Uint8Array(payload.encryptedAESKey);
        tamperedKey[0] ^= 0xff; // flip first byte
        payload.encryptedAESKey = tamperedKey.buffer;

        await expect(hybridDecryptPayload(payload, bobKeys.privateKey))
        .rejects.toThrow();
    });

    it('should fail decryption if ciphertext is tampered', async () => {
        const bobKeys = await generateRSAKeys();
        const message = 'Hello Bob! This is Alice.';

        const payload = await hybridEncryptPayload(message, bobKeys.publicKey);

        const tamperedCipher = new Uint8Array(payload.encryptedAESPayload.cipherText);
        tamperedCipher[0] ^= 0xff; // flip first byte
        payload.encryptedAESPayload.cipherText = tamperedCipher.buffer;

        await expect(hybridDecryptPayload(payload, bobKeys.privateKey))
        .rejects.toThrow();
    });
});
