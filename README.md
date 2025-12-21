# Handshake-frontend
Handshake is a secure chat application demonstrating end-to-end encryption using hybrid cryptography (RSA + AES) with digital signatures for message integrity.

It’s built with:

Frontend: React + TypeScript + Vite

Cryptography: Web Crypto API (AES-GCM for symmetric encryption, RSA-OAEP for key exchange, RSA-PSS for signatures)

Transport: WebSockets for real-time messaging

The project showcases:

Hybrid encryption for secure message transmission

Signing and verifying messages to detect tampering

A modern, modular frontend architecture

## Running
1. Clone the repository: `git clone https://github.com/alvarez-moreno-sergio/handshake-frontend`
2. Install dependencies with: `npm install`
3. Start the development server: `npm run dev`

This runs the Vite React frontend.
Open your browser at the URL shown in the terminal.

## Testing
Run the test suite: `npm run test`

## Workflow
### Agents
- Alice
- Bob
- Server

### Chat Startup
- Alice sends a request to Server:
    {Alice_username, Bob_username}
- Bob receives request and replies to Server:
    {Bob_username, Alice_username}
- Server creates a Socket connection between Alice & Bob

- Both parties proceed to Handshake

### Handshake
- Both parties generates RSA pair keys
- Both parties generates RSA Signing pair keys
- Alice shares Alice's public key & public signing key with Bob
- Bob shares Bob's public key & public signing key with Alice

### Message send workflow
- Alice wants to send a message to Bob
- Alice encrypts the message using simmetric AES
- Alice encrypts the simmetric key using Bob's public key
- Alice builds the payload using encrypted message & encrypted AES key
- Alice signs the payload using Alice private signing key
- Alice sends the signed payload to Bob

### Message recive workflow
- Bob receives a signed payload from Alice
- Bob asserts signature using Alice public signing key
- Bob decrypts the AES key using Bob's private key
- Bob decrypts the message using decrypted AES key

### Keys rotation
All parties' public and private keys can be renewed on-demand, and Handshake will be triggered again
