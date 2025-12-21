export async function generateRSAKeys(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
    );

    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
}

export async function generateRSASigningKeys(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
    return crypto.subtle.generateKey(
        {
            name: 'RSA-PSS',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
    );
}

export async function encryptRSA(data: string | ArrayBuffer, publicKey: CryptoKey): Promise<ArrayBuffer> {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, buffer);
}

export async function decryptRSA(cipherText: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
    return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, cipherText);
}

export async function signData(data: string | ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;

    return crypto.subtle.sign(
        { name: 'RSA-PSS', saltLength: 32 },
        privateKey,
        buffer
    );
}

export async function verifySignature(data: string | ArrayBuffer, signature: ArrayBuffer, publicKey: CryptoKey): Promise<boolean> {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;

    return crypto.subtle.verify(
        { name: 'RSA-PSS', saltLength: 32 },
        publicKey,
        signature,
        buffer
    );
}
