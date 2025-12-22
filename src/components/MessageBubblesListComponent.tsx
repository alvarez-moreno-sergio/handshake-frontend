import { useState, useRef, useEffect } from "react";
import { Box, IconButton, InputBase } from "@mui/material";
import MessageBubbleComponent, { type MessageBubble, type Sender } from "./MessageBubbleComponent";
import SendIcon from "@mui/icons-material/Send";
import { type Hand, type ApiSafeHand } from "./HandComponent";
import { encryptAndSignPayload, verifyAndDecrypt, type SignedEncryptedPayload } from "../crypto/hybrid-signed";
import { decodeTransport, encodeTransport, type TransportSignedEncryptedPayload } from "../crypto/transport-codec";

type MessageBubblesListComponentProps = {
    selectedHand?: ApiSafeHand | null;
    chatStatus: "idle" | "connecting" | "ready" | "error";
    wsRef: React.RefObject<WebSocket | null>;
    ownHand: Hand | null;
}

const MessagesBubbleListComponent = ({ selectedHand, chatStatus, wsRef, ownHand } : MessageBubblesListComponentProps) => {
    const isDisabled = chatStatus !== "ready";
    const selectedHandRef = useRef<ApiSafeHand | null>(selectedHand || null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<MessageBubble[]>([]);

    useEffect(() => {
        selectedHandRef.current = selectedHand ?? null;
    }, [selectedHand]);
    
    const SendMessage = async (sender: Sender, text: string) => {
        const trimmed = text.trim();
        if (trimmed === "") return;

        const newMessage: MessageBubble = {
            id: Date.now().toString(),
            sender,
            text,
            encryptedPayload: await encryptAndSignPayload(trimmed, selectedHand?.publicKey, ownHand?.signKeyPair?.privateKey)
        };
        console.log("Encrypted payload:", JSON.stringify(encodeTransport(newMessage.encryptedPayload!), null, 2));

        setMessages(prev => [...prev, newMessage]);
        setInputText("");

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedHand?.uuid) {
            const payload = {
                type: "send",
                to: selectedHand.uuid,
                from: ownHand?.uuid,
                content: encodeTransport(newMessage.encryptedPayload!)
            };
            wsRef.current.send(JSON.stringify(payload));
        }
    };

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        queueMicrotask(() => {
            setMessages([]);
            setInputText("");
        });
    }, [selectedHand?.uuid]);

    useEffect(() => {
        const ReceiveMessage = async (msg: TransportSignedEncryptedPayload) => {            
            console.log("Received payload:", JSON.stringify(debugSignedEncryptedPayload(decodeTransport(msg)), null, 2));
            let decryptedText: string;
            try {
                decryptedText = await verifyAndDecrypt(
                    decodeTransport(msg),
                    ownHand!.keyPair?.privateKey,
                    selectedHandRef.current!.publicSignKey!
                );
                if (!decryptedText) {
                    console.error("Failed to decrypt message");
                    return;
                }
            }
            catch (err) {
                console.error("Error during decryption/verification:", err);
                return;
            }

            const trimmed = decryptedText.toString().trim();
            if (!trimmed) return;
            console.log("Decrypted payload:", trimmed);

            const newMessage: MessageBubble = {
                id: Date.now().toString(),
                sender: "them",
                text: trimmed
            };
            setMessages(prev => [...prev, newMessage]);
        };

        const ws = wsRef.current;
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "message") {
                    ReceiveMessage(data.content);
                }
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        ws.addEventListener("message", handleMessage);

        return () => {
            ws.removeEventListener("message", handleMessage);
        };
    }, [wsRef, ownHand?.uuid, ownHand]);

    return (
        <>
            <Box
                sx={{
                flex: 1,
                p: 2,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                bgcolor: "#f9f9f9",
                }}
                >
                    {messages.map((msg) => (
                        <MessageBubbleComponent key={msg.id} {...msg} />
                    ))}
            <div ref={bottomRef} />
            </Box>

            <Box
                sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                borderTop: "1px solid #e0e0e0",
                bgcolor: "#fafafa",
                }}
            >

                {/* Attachment button */}
                <IconButton color="primary" sx={{ mr: 1, ":hover": { backgroundColor: "primary.main", color: "white" } }} >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="2 2 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21.44 11.05l-9.19 9.19a3 3 0 01-4.24-4.24l9.19-9.19a2 2 0 112.83 2.83l-8.49 8.49a1 1 0 11-1.41-1.41l7.78-7.78"/>
                </svg>
                </IconButton>

                <InputBase
                disabled={isDisabled}
                placeholder={
                    chatStatus === "connecting"
                        ? "Establishing secure channel..."
                        : chatStatus === "error"
                        ? "Connection failed."
                        : "Type a message..."
                }
                sx={{
                    flex: 1,
                    px: 2,
                    py: 1,
                    bgcolor: isDisabled ? "#ccc" : "#fff",
                    cursor: isDisabled ? "not-allowed" : "text",
                    borderRadius: 2,
                    border: "1px solid #ccc",
                }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyUp={(e) => {
                    if (!isDisabled && e.key === "Enter") {
                        SendMessage("me", inputText);
                    }
                }}
                />
                <IconButton color="primary" sx={{ ml: 1, ":hover": { backgroundColor: "primary.main", color: "white" } }}>
                    <SendIcon onClick={() => SendMessage("me", inputText)} />
                </IconButton>
            </Box>
        </>
    );
};

export default MessagesBubbleListComponent;

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function debugSignedEncryptedPayload(payload: SignedEncryptedPayload) {
  return {
    encryptedPayload: {
      encryptedAESKey: arrayBufferToBase64(payload.encryptedPayload.encryptedAESKey),
      encryptedAESPayload: {
        iv: Array.from(
          payload.encryptedPayload.encryptedAESPayload.iv instanceof ArrayBuffer
            ? new Uint8Array(payload.encryptedPayload.encryptedAESPayload.iv)
            : new Uint8Array(payload.encryptedPayload.encryptedAESPayload.iv.buffer)
        ),
        cipherText: arrayBufferToBase64(payload.encryptedPayload.encryptedAESPayload.cipherText),
      },
    },
    signature: arrayBufferToBase64(payload.signature),
  };
}
