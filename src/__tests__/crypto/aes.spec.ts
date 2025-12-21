import { describe, it, expect } from 'vitest';
import { generateAESKey, encryptAES, decryptAES, exportKey, importKey } from '../../crypto/aes';

describe('AES module', () => {
    it('should encrypt and decrypt a message correctly', async () => {
        const key = await generateAESKey();
        const message = 'Hello Bob! This is Alice.';
    
        const { iv, cipherText } = await encryptAES(message, key);
        const decrypted = await decryptAES(cipherText, key, iv);

        expect(decrypted).toBe(message);
    });

    it('should export and import a key correctly', async () => {
        const key = await generateAESKey();
        const exported = await exportKey(key);
        const importedKey = await importKey(exported);

        const message = 'Hello Bob! This is Alice.';
        const { iv, cipherText } = await encryptAES(message, importedKey);
        const decrypted = await decryptAES(cipherText, importedKey, iv);

        expect(decrypted).toBe(message);
    });
});
