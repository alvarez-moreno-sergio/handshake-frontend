export async function generateAESKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encryptAES(
    plaintext: string,
    key: CryptoKey
): Promise<{ iv: BufferSource; cipherText: ArrayBuffer }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const cipherText = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );

    return { iv, cipherText };
}

export async function decryptAES(
    cipherText: ArrayBuffer,
    key: CryptoKey,
    iv: BufferSource
): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherText
    );

    return new TextDecoder().decode(decrypted);
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey('raw', key);
    const bytes = new Uint8Array(raw);

    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function importKey(rawHex: string): Promise<CryptoKey> {
    const bytes = new Uint8Array(rawHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));

    return crypto.subtle.importKey(
        'raw',
        bytes.buffer,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );
}
