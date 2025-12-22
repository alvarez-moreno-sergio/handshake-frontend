import { Box, Typography } from "@mui/material";
import type { SignedEncryptedPayload } from "../crypto/hybrid-signed";
export type Sender = "me" | "them";
export type MessageBubble = {
    id: string;
    sender: Sender;
    text: string;
    encryptedPayload?: SignedEncryptedPayload | null;
};
const MessageBubbleComponent = (msg : MessageBubble) => {
    return (
                <Box
                    id={msg.id}
                    sx={{
                    alignSelf: msg.sender === "me" ? "flex-end" : "flex-start",
                    bgcolor: msg.sender === "me" ? "primary.main" : "secondary.main",
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                    maxWidth: "70%",
                    }}
                >
                    <Typography variant="body2">{msg.text}</Typography>
                </Box>
    );
};

export default MessageBubbleComponent;
