import {
    Box,
    Typography,
    Avatar,
    Button,
    Paper,
} from "@mui/material";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
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

const MessageBubbleComponent = (msg: MessageBubble) => {
    const fileUrl = useMemo(() => {
        if (!msg.fileData) return null;

        const data = new Uint8Array(msg.fileData);
        const file = new File(
            [data],
            msg.fileName!
        );
        return URL.createObjectURL(file);
    }, [msg.fileData, msg.fileName]);

    const isMe = msg.sender === "me";
    const hasFile = Boolean(fileUrl && msg.fileName);

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "flex-end",
                gap: 1,
                alignSelf: isMe ? "flex-end" : "flex-start",
                flexDirection: isMe ? "row-reverse" : "row",
            }}
        >
            {/* Avatar */}
            <Avatar
                src={sanitizeAvatarUrl(msg.avatarUrl!) || undefined}
                sx={{
                    width: 28,
                    height: 28,
                    fontSize: 14,
                    bgcolor: isMe ? "primary.main" : "secondary.main",
                }}
            >
                {isMe ? "Me" : "?"}
            </Avatar>

            {/* Message bubble */}
            <Box
                id={msg.id}
                sx={{
                    bgcolor: hasFile
                        ? isMe
                            ? "primary.dark"
                            : "secondary.dark"
                        : isMe
                        ? "primary.main"
                        : "secondary.main",
                    color: "white",
                    p: 1.5,
                    borderRadius: 2,
                    maxWidth: "70%",
                }}
            >
                {/* Text message */}
                {!hasFile && (
                    <Typography variant="body2">{msg.text}</Typography>
                )}

                {/* File message */}
                {hasFile && (
                    <Paper
                        elevation={0}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            p: 1,
                            bgcolor: "rgba(255,255,255,0.9)",
                            color: "text.primary",
                            borderRadius: 1.5,
                        }}
                    >
                        <InsertDriveFileIcon color="action" />

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {msg.fileName}
                            </Typography>
                        </Box>

                        <Button
                            component="a"
                            href={fileUrl!}
                            download={msg.fileName}
                            size="small"
                            variant="contained"
                            disabled={isMe}
                            sx={{ textTransform: "none" }}
                        >
                            Download
                        </Button>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default MessageBubbleComponent;
