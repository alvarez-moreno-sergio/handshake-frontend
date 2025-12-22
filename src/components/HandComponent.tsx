import { Avatar, Box, Typography, CircularProgress } from "@mui/material";

export type Hand = {
    key: string | null;
    uuid: number | null;
    name: string;
    avatarUrl: string;
    keyPair: { publicKey: CryptoKey; privateKey: CryptoKey } | null;
    signKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey } | null;
    publicKey: CryptoKey | null;
    publicSignKey: CryptoKey | null;
    selected?: boolean;
    selectable?: boolean;
};

export type ApiSafeHand = {
  key: string | null;
  uuid: number | null;
  name: string;
  avatarUrl: string;
  publicKey: string;
  publicSignKey: string;
  selected?: boolean;
  selectable?: boolean;
};

export type ChatStatus = "idle" | "connecting" | "ready" | "error";

type HandComponentProps = {
    hand?: ApiSafeHand | null;
    onClick?: () => void;
    chatStatus: ChatStatus;
};

const HandComponent = ({ hand, onClick, chatStatus }: HandComponentProps) => {
    if (!hand) {
        return (
            <Typography variant="h6" sx={{p: 1.5}}>Messages</Typography>
        );
    }

    const {
        name,
        avatarUrl,
        selected = false,
        selectable = true
    } = hand;
    return (
        <Box
            sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1,
            cursor: "pointer",
            "&:hover": !selected && selectable ? { backgroundColor: "primary.main", color: "white" } : {},
            backgroundColor: selected && selectable ? "secondary.main" : "transparent",
            color: selected ? "white" : "black",
            }}
            onClick={onClick || (() => {})}
        >
            <Avatar src={avatarUrl} />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="body1">{name}</Typography>

                {chatStatus === "connecting" && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CircularProgress size={12} />
                        <Typography variant="caption" color="text.secondary">
                            Establishing secure channel…
                        </Typography>
                    </Box>
                )}

                {chatStatus === "error" && (
                    <Typography variant="caption" color="error">
                        Connection failed
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default HandComponent;
