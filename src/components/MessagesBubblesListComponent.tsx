import { useState, useRef, useEffect, useMemo } from "react";
import { Box, IconButton, InputBase } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

import MessageBubbleComponent, { type MessageBubble, type Sender } from "./MessageBubbleComponent";
import { type Hand, type ApiSafeHand } from "./HandComponent";

import { encryptAndSignPayload, verifyAndDecrypt, type SignedEncryptedPayload } from "../crypto/hybrid-signed";
import { decodeTransport, encodeTransport, type TransportSignedEncryptedPayload } from "../crypto/transport-codec";

import { sanitizeAvatarUrl } from "../helpers/xss";
import { arrayBufferToBase64 } from "../helpers/buffer";

type MessageBubblesListComponentProps = {
    selectedHand?: ApiSafeHand | null;
    chatStatus: "idle" | "connecting" | "ready" | "error";
    wsRef: React.RefObject<WebSocket | null>;
    ownHand: Hand | null;
    handList: ApiSafeHand[];
    setUnreadMap: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

type ConversationMap = {
    map: Record<string, MessageBubble[]>;
}

const MessagesBubbleListComponent = ({ selectedHand, chatStatus, wsRef, ownHand, handList, setUnreadMap } : MessageBubblesListComponentProps) => {
    const isDisabled = chatStatus !== "ready" || !selectedHand;
    const selectedHandRef = useRef<ApiSafeHand | null>(selectedHand || null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [inputText, setInputText] = useState("");
    const [conversation, setConversation] = useState<ConversationMap>({ map: {} });
    const selectedUuid = selectedHand?.uuid;
    const messages = useMemo(() => {
        if (!selectedUuid) return [];
        return conversation.map[selectedUuid] ?? [];
    }, [selectedUuid, conversation]);

    const appendMessage = (uuid: string, message: MessageBubble) => {
        setConversation(prev => ({
            ...prev,
            map: {
                ...prev.map,
                [uuid]: [...(prev.map[uuid] ?? []), message],
            }
        }));
    };

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
            avatarUrl: sanitizeAvatarUrl(ownHand!.avatarUrl),
            encryptedPayload: await encryptAndSignPayload(trimmed, selectedHand?.publicKey, ownHand?.signKeyPair?.privateKey)
        };
        console.log("Encrypted payload:", JSON.stringify(encodeTransport(newMessage.encryptedPayload!), null, 2));

        if (!selectedHand?.uuid) return;
        appendMessage(selectedHand.uuid, newMessage);

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
        if (!selectedHand?.uuid) return;
        if (isDisabled) return;

        inputRef.current?.focus();
    }, [selectedHand?.uuid, isDisabled]);

    useEffect(() => {
        const ReceiveMessage = async (msg: TransportSignedEncryptedPayload, from: string) => {
            console.log("Received payload:", JSON.stringify(debugSignedEncryptedPayload(decodeTransport(msg)), null, 2));
            const handSender = handList?.filter(h => h.uuid === from)[0];
            if (!handSender) {
                console.error("Received message from unknown hand:", from);
                return;
            }
            let decryptedText: string;
            try {
                decryptedText = await verifyAndDecrypt(
                    decodeTransport(msg),
                    ownHand!.keyPair?.privateKey,
                    handSender?.publicSignKey
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
                avatarUrl: sanitizeAvatarUrl(handSender.avatarUrl),
                text: trimmed
            };
            appendMessage(from, newMessage);
            if (from !== selectedHandRef.current?.uuid) {
                setUnreadMap(prev => ({
                    ...prev,
                    [from]: (prev[from] || 0) + 1
                }));
            }
        };

        const ws = wsRef.current;
        if (!ws) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (!data || typeof data !== "object" || typeof data.type !== "string") {
                    return;
                }
                if (data.type === "message") {
                    ReceiveMessage(data.content, data.from);
                }
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        ws.addEventListener("message", handleMessage);

        return () => {
            ws.removeEventListener("message", handleMessage);
        };
    }, [wsRef, ownHand?.uuid, ownHand, handList, setUnreadMap]);

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
                key={selectedHand?.uuid ?? "no-hand"}
                inputRef={inputRef}
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
