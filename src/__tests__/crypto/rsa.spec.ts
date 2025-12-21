import { describe, it, expect } from 'vitest';
import { generateRSAKeys, generateRSASigningKeys, encryptRSA, decryptRSA, signData, verifySignature } from '../../crypto/rsa';

describe('RSA module', () => {
    it('should encrypt and decrypt a string correctly', async () => {
        const { publicKey, privateKey } = await generateRSAKeys();
        const message = 'Hello Bob! This is Alice.';
        
        const encrypted = await encryptRSA(message, publicKey);
        const decryptedBuffer = await decryptRSA(encrypted, privateKey);
        const decrypted = new TextDecoder().decode(decryptedBuffer);

        expect(decrypted).toBe(message);
    });

    it('should sign and verify a message correctly', async () => {
        const { publicKey, privateKey } = await generateRSASigningKeys();
        const message = 'Hello Bob! This is Alice.';
        
        const signature = await signData(message, privateKey);
        const valid = await verifySignature(message, signature, publicKey);

        expect(valid).toBe(true);
    });

    it('should fail verification if message is tampered', async () => {
        const { publicKey, privateKey } = await generateRSASigningKeys();
        const message = 'Hello Bob! This is Alice.';
        
        const signature = await signData(message, privateKey);
        const tamperedMessage = 'Tampered message';
        const valid = await verifySignature(tamperedMessage, signature, publicKey);

        expect(valid).toBe(false);
    });
});
