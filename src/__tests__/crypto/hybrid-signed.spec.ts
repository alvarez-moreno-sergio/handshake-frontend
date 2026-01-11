import { describe, it, expect } from 'vitest';
import { generateRSAKeys, generateRSASigningKeys, exportPublicKey } from '../../crypto/rsa';
import type { SignedEncryptedPayload } from '../../crypto/hybrid-signed';
import { encryptAndSignPayload, verifyAndDecrypt } from '../../crypto/hybrid-signed';

describe('Hybrid Signed Encryption', () => {
    it('should encrypt and decrypt message correctly', async () => {
        const bobKeys = await generateRSAKeys();
        const aliceSigningKeys = await generateRSASigningKeys();

        const message = 'Hello Bob! This is Alice.';

        const signedPayload: SignedEncryptedPayload = await encryptAndSignPayload(
            message,
            await exportPublicKey(bobKeys.publicKey),
            aliceSigningKeys.privateKey
        );

        const decryptedMessage = await verifyAndDecrypt(
            signedPayload,
            bobKeys.privateKey,
            await exportPublicKey(aliceSigningKeys.publicKey)
        );

        expect(decryptedMessage).toBe(message);
    });

    it('should fail verification if signature is tampered', async () => {
        const bobKeys = await generateRSAKeys();
        const aliceSigningKeys = await generateRSASigningKeys();

        const message = 'Hello Bob! This is Alice.';

        const signedPayload: SignedEncryptedPayload = await encryptAndSignPayload(
            message,
            await exportPublicKey(bobKeys.publicKey),
            aliceSigningKeys.privateKey
        );

        const tamperedSignature = new Uint8Array(signedPayload.signature);
        tamperedSignature[0] ^= 0xff; // flip first byte
        signedPayload.signature = tamperedSignature.buffer;

        await expect(
            verifyAndDecrypt(
                signedPayload, 
                bobKeys.privateKey, 
                await exportPublicKey(aliceSigningKeys.publicKey)
        )).rejects.toThrow('Signature verification failed');
    });

    it('should fail decryption if payload is tampered', async () => {
        const bobKeys = await generateRSAKeys();
        const aliceSigningKeys = await generateRSASigningKeys();

        const message = 'Hello Bob! This is Alice.';

        const signedPayload: SignedEncryptedPayload = await encryptAndSignPayload(
            message,
            await exportPublicKey(bobKeys.publicKey),
            aliceSigningKeys.privateKey
        );

        const tamperedPayload = signedPayload.encryptedPayload;
        const cipherTextArr = new Uint8Array(tamperedPayload.encryptedAESPayload.cipherText);
        cipherTextArr[0] ^= 0xff; // flip first byte
        tamperedPayload.encryptedAESPayload.cipherText = cipherTextArr.buffer;

        signedPayload.encryptedPayload = tamperedPayload;

        await expect(
            verifyAndDecrypt(
                signedPayload,
                bobKeys.privateKey,
                await exportPublicKey(aliceSigningKeys.publicKey)
        )).rejects.toThrow('Signature verification failed');
    });
});
