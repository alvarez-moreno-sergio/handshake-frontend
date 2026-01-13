import { Box, Typography, Avatar, Button } from "@mui/material";
import type { SignedEncryptedPayload } from "../crypto/hybrid-signed";
import { sanitizeAvatarUrl } from "../helpers/xss";
import { useMemo } from "react";

export type Sender = "me" | "them";
export type MessageBubble = {
    id: string;
    sender: Sender;
    text: string;
    avatarUrl?: string | null;
    encryptedPayload?: SignedEncryptedPayload | null;
    fileData?: Uint8Array<ArrayBufferLike> | ArrayBuffer;
    fileName?: string;
};
const MessageBubbleComponent = (msg : MessageBubble) => {    
    const fileUrl = useMemo(() => {
        const data = msg.fileData && msg.fileData instanceof Uint8Array
            ? new Uint8Array(Array.from(msg.fileData)) // ensures standard ArrayBuffer
            : new Uint8Array(msg.fileData!);

        if (!data) return null;

        const blob = new Blob([data]);
        return URL.createObjectURL(blob);
    }, [msg.fileData]);
  
    return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 1,
                    alignSelf: msg.sender === "me" ? "flex-end" : "flex-start",
                    flexDirection: msg.sender === "me" ? "row-reverse" : "row",
                }}
                >
                {/* Avatar */}
                <Avatar
                    src={sanitizeAvatarUrl(msg.avatarUrl!) || undefined}
                    sx={{
                    width: 28,
                    height: 28,
                    fontSize: 14,
                    bgcolor: msg.sender === "me" ? "primary.main" : "secondary.main",
                    }}
                >
                    {msg.sender === "me" ? "Me" : "?"}
                </Avatar>

                {/* Message bubble */}
                <Box
                    id={msg.id}
                    sx={{
                    bgcolor: msg.sender === "me" ? "primary.main" : "secondary.main",
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                    maxWidth: "70%",
                    }}
                >
                    {!msg.fileData && <Typography variant="body2">{msg.text}</Typography>}

                    {fileUrl && msg.fileName && (
                        <Box>
                            <Button
                                component="a"
                                size="small"
                                sx={{ bgcolor: "white", color: "black", textTransform: "none" }}
                                href={fileUrl}
                                download={msg.fileName}
                                onClick={() => setTimeout(() => URL.revokeObjectURL(fileUrl), 5000)}
                                disabled={msg.sender === "me"}
                            >
                                Download {msg.fileName}
                            </Button>
                            <Typography variant="body2">This is file can only be downloaded ONCE.</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
    );
};

export default MessageBubbleComponent;
