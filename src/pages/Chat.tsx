import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Typography,
  Box,
  Button
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import HandsListComponent from "../components/HandsListComponent";
import HandComponent, { type Hand, type ApiSafeHand } from "../components/HandComponent";
import MessagesBubbleListComponent from "../components/MessagesBubblesListComponent";

import {
  generateRSAKeys,
  generateRSASigningKeys,
  exportPublicKey
} from "../crypto/rsa";

type ChatStatus = "idle" | "connecting" | "ready" | "error";

const Chat = () => {
  const HEADER_HEIGHT = 72;

  const [profileOpen, setProfileOpen] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const profileReady = Boolean(displayName.trim() && !profileOpen);

  const [selectedHand, setSelectedHand] = useState<ApiSafeHand | null>(null);
  const [handList, setHandList] = useState<ApiSafeHand[]>([]);
  const [chatStatus, setChatStatus] = useState<ChatStatus>("idle");
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const handRef = useRef<Hand | null>(null);
  const [ownHand, setOwnHand] = useState<Hand | null>(null);

  const setupLocalHand = useCallback(async (name: string, avatarUrl: string) => {
    const keyPair = await generateRSAKeys();
    const signKeyPair = await generateRSASigningKeys();

    const apiSafeHand: ApiSafeHand = {
      key: null,
      uuid: null,
      name,
      avatarUrl,
      publicKey: await exportPublicKey(keyPair.publicKey),
      publicSignKey: await exportPublicKey(signKeyPair.publicKey)
    };

    return { apiSafeHand, keyPair, signKeyPair };
  }, []);

  const registerHand = useCallback(async (apiSafeHand: ApiSafeHand, keyPair: CryptoKeyPair, signKeyPair: CryptoKeyPair): Promise<void> => {
    const res = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiSafeHand)
    });

    if (!res.ok) {
      throw new Error("Failed to register hand");
    }

    const data = await res.json();
    apiSafeHand.key = data.key;
    apiSafeHand.uuid = data.uuid;

    const localHand: Hand = {
      key: apiSafeHand.key,
      uuid: apiSafeHand.uuid,
      avatarUrl: apiSafeHand.avatarUrl,
      name: apiSafeHand.name,
      publicKey: keyPair.publicKey,
      publicSignKey: signKeyPair.publicKey,
      keyPair,
      signKeyPair
    };

    handRef.current = localHand;
    setOwnHand(localHand);
  }, []);

  const openWebSocket = useCallback((uuid: string): WebSocket => {
    const ws = new WebSocket("ws://localhost:3000");
    wsRef.current = ws;

    ws.onopen = () => {
      setChatStatus("ready");
      ws.send(JSON.stringify({ type: "subscribe", uuid }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "peerList") {
        const peers: ApiSafeHand[] = data.peers.filter((h: ApiSafeHand) => h.uuid !== handRef.current?.uuid);
        setHandList(peers);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return ws;
  }, []);

  // -----------------------------
  // Register + WebSocket lifecycle
  // -----------------------------
  const hasRegisteredRef = useRef(false);
  useEffect(() => {
    if (!profileReady || hasRegisteredRef.current) return;
    hasRegisteredRef.current = true;

    let active = true;
    async function init() {
      try {
        if (!active) return;
        const { apiSafeHand, keyPair, signKeyPair } = await setupLocalHand(displayName, avatarUrl);
        await registerHand(apiSafeHand, keyPair, signKeyPair);
        openWebSocket(apiSafeHand.uuid!);
      } catch (err) {
        console.error(err);
        setChatStatus("error");
      }
    }

    init();

    return () => {
      active = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [profileReady, avatarUrl, displayName, setupLocalHand, registerHand, openWebSocket]);

  // -----------------------------
  // Selection logic
  // -----------------------------

  const handleSelectHand = async (handId: string | null) => {
    if (handId === null) {
      return;
    }
    const hand = handList.find(h => h.uuid === handId);
    if (!hand) return;

    setUnreadMap(prev => ({
      ...prev,
      [hand.uuid!]: 0
    }));

    setHandList(prev =>
      prev.map(h => ({ ...h, selected: h.uuid === handId }))
    );

    setSelectedHand(prev => {
      if (prev?.uuid === hand.uuid) {
        setHandList(l => l.map(h => ({ ...h, selected: false })));
        return null;
      }
      return { ...hand, selectable: false };
    });


    setChatStatus("connecting");

    try {
      setChatStatus("ready");
    } catch (err) {
      console.error(err);
      setChatStatus("error");
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) return;

    setProfileOpen(false);
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <Box
      sx={{
        minHeight: "88.61vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "primary.main",
        color: "white",
        py: 4,
        px: 2
      }}
    >
      <Typography variant="h2" align="center" gutterBottom>
        Chat
      </Typography>

      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: 1400,
          height: { xs: "80vh", md: "70vh" },
          backgroundColor: "#fff",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 3,
          color: "black"
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            width: { xs: 200, md: 300 },
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #e0e0e0",
            backgroundColor: "#f5f5f5"
          }}
        >
          <Box
            sx={{
              p: 3.5,
              borderBottom: "1px solid #e0e0e0",
              height: HEADER_HEIGHT,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Lobby</Typography>
          </Box>


          <HandsListComponent
            handList={handList}
            onSelectHand={handleSelectHand}
            unreadMap={unreadMap}
          />
        </Box>

        {/* Chat area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #e0e0e0",
              display: "flex",
              alignItems: "center",
              minHeight: HEADER_HEIGHT,
              height: HEADER_HEIGHT,        // force fixed height
            }}
          >
            {/* Hand info, or empty space if none */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {selectedHand && (
                <HandComponent
                  hand={selectedHand}
                  chatStatus={chatStatus}
                  unreadMap={unreadMap}
                />
              )}
            </Box>

            {/* Button always on the right */}
            <Button variant="contained" sx={{ ml: "auto" }}>
              Rotate keys
            </Button>
          </Box>



          {ownHand && (
          <MessagesBubbleListComponent
            selectedHand={selectedHand}
            chatStatus={chatStatus}
            wsRef={wsRef}
            ownHand={ownHand}
            handList={handList}
            setUnreadMap={setUnreadMap}
          />
        )}

        </Box>
      </Box>
      <Dialog open={profileOpen} maxWidth="xs" fullWidth disableEscapeKeyDown>
        <Box component="form" onSubmit={handleProfileSubmit}>
        <DialogTitle>Set up your profile</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Avatar
              src={avatarUrl || undefined}
              sx={{ width: 72, height: 72 }}
            />
          </Box>

          <TextField
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            fullWidth
            autoFocus
            required
          />

          <TextField
            label="Avatar URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            fullWidth
            placeholder="https://…"
          />
        </DialogContent>

        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={!displayName.trim()}
          >
            Continue
          </Button>
        </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Chat;
