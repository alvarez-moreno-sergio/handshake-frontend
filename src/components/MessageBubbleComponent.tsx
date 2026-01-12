import { Box, Typography, Avatar } from "@mui/material";
import type { SignedEncryptedPayload } from "../crypto/hybrid-signed";
import { sanitizeAvatarUrl } from "../helpers/xss";

export type Sender = "me" | "them";
export type MessageBubble = {
    id: string;
    sender: Sender;
    text: string;
    avatarUrl?: string | null;
    encryptedPayload?: SignedEncryptedPayload | null;
};
const MessageBubbleComponent = (msg : MessageBubble) => {
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
                    <Typography variant="body2">{msg.text}</Typography>
                </Box>
            </Box>
    );
};

export default MessageBubbleComponent;
