# Handshake Frontend

**Handshake Frontend** is the client‑side user interface for a secure chat application demonstrating end‑to‑end encryption (E2EE) using hybrid cryptography (RSA + AES) with cryptographic signatures for integrity and non‑repudiation. It provides a modern, modular React + TypeScript frontend that communicates with a backend or WebSocket signaling server.

---

## 📌 Table of Contents

0. Live Demo
1. Project Overview  
2. Motivation  
3. Features  
4. Architecture  
5. Encryption & Security Design  
6. Handshake Protocol  
7. Message Workflow  
8. Install & Development  
9. Configuration  
10. Testing  
11. Deployment  
12. Security Considerations  
13. Contributing  
14. License  

---

## 0. Live Demo

[Watch presentation video](https://drive.google.com/file/d/1Li-FCevAMBBmXq-1D_iuGNmmpD2eTOK_/view?usp=sharing)

Or access the live demo [here](https://handshake-frontend.onrender.com)

---

## 1. Project Overview

Handshake Frontend implements a secure chat UI that:

- Establishes encrypted channels between peers
- Performs hybrid cryptography with AES + RSA
- Signs payloads to assure message authenticity
- Relies on WebSockets for bidirectional real‑time messaging

**Technology stack**

- Frontend: React + TypeScript + Vite  
- Cryptography: Web Crypto API (AES‑GCM, RSA‑OAEP, RSA‑PSS)  
- Transport: WebSockets  

This repository contains only the frontend; backend can be found [here](https://github.com/alvarez-moreno-sergio/handshake-backend)

---

## 2. Motivation

The project exists to demonstrate how modern browsers can implement practical end‑to‑end encryption using native cryptographic primitives. It focuses on clarity and correctness rather than production‑grade feature completeness.

---

## 3. Features

- Hybrid end‑to‑end encryption (AES + RSA)
- Signed messages for integrity and authenticity
- Ephemeral session keys
- WebSocket‑based real‑time messaging
- Modular, typed React architecture
- Simple, auditable cryptographic flow

---

## 4. Architecture

```
Client A (Browser)
  └─ React + WebCrypto
        │
        │  WebSocket
        ▼
Signaling / Relay Server
        │
        ▼
Client B (Browser)
```

The server **never** decrypts message content and only relays encrypted payloads and public keys.

---

## 5. Encryption & Security Design

### Cryptographic Primitives

| Purpose | Algorithm |
|------|----------|
| Message encryption | AES‑GCM |
| Key exchange | RSA‑OAEP |
| Message signing | RSA‑PSS |

AES is used for encrypting message content due to performance, while RSA is used to securely exchange AES keys and verify message authenticity.

---

## 6. Handshake Protocol

1. Each client generates:
   - RSA encryption key pair
   - RSA signing key pair
2. Public keys are exchanged via the signaling server
3. Private keys remain in browser memory only

No private keys are transmitted or persisted.

---

## 7. Message Workflow

### Sending

1. Generate random AES session key
2. Encrypt message with AES‑GCM
3. Encrypt AES key with recipient’s RSA public key
4. Sign encrypted payload with sender’s private RSA‑PSS key
5. Transmit via WebSocket

### Receiving

1. Verify signature using sender’s public key
2. Decrypt AES key with private RSA key
3. Decrypt message content
4. Display plaintext to user

---

## 8. Install & Development

### Requirements

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/alvarez-moreno-sergio/handshake-frontend.git
cd handshake-frontend
npm install
```

### Run locally

```bash
npm run dev
```

---

## 9. Configuration

Environment variables are managed through Vite. Choose one of the following, or adapt it to your deployment needs:

- Example `.env` for DEVELOPMENT environment:

```
VITE_API_URL=http://localhost:3000
```

- Example `.env` for PRODUCTION environment:

```
VITE_API_URL=https://handshake-backend-y29h.onrender.com
```

---

## 10. Testing

```bash
npm run test
```

(Extend test coverage for cryptographic edge cases as needed.)

---

## 11. Deployment

```bash
npm run build
```

The build output can be hosted on:

- Vercel
- Netlify
- GitHub Pages
- Any static web server

Ensure `wss://` is used in production.

---

## 12. Security Considerations

- Always deploy over HTTPS / WSS
- Do not persist private keys in localStorage
- Treat this project as an educational reference
- Perform threat modeling before production use

---

## 13. Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear documentation

---

## 14. License

Apache-2.0 2026 Sergio Alvarez Moreno
