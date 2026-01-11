import { Avatar, Box, Typography, CircularProgress, Badge } from "@mui/material";

export type Hand = {
    key: string | null;
    uuid: string | null;
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
  uuid: string | null;
  name: string;
  avatarUrl: string;
  publicKey: string;
  publicSignKey: string;
  selected?: boolean;
  selectable?: boolean;
};

export type ChatStatus = "idle" | "connecting" | "ready" | "error";

type HandComponentProps = {
    hand: ApiSafeHand;
    onClick?: () => void;
    chatStatus: ChatStatus;
    unreadMap: Record<string, number>;
};

const HandComponent = ({ hand, onClick, chatStatus, unreadMap }: HandComponentProps) => {
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
            <Badge
                badgeContent={unreadMap[hand.uuid!] || 0}
                invisible={(!unreadMap[hand.uuid!])}
                color="error"
            >
            <Avatar src={avatarUrl} />
            </Badge>
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
