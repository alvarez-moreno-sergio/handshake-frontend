import {Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar} from "@mui/material";
import { Typography, Box, Button } from "@mui/material";
import HandsListComponent from "../components/HandsListComponent";
import HandComponent, { type Hand, type ApiSafeHand } from "../components/HandComponent";
import MessagesBubbleListComponent from "../components/MessageBubblesListComponent";
import { useEffect, useRef, useState } from "react";
import { generateRSAKeys, generateRSASigningKeys, exportPublicKey } from "../crypto/rsa";

type ChatStatus = "idle" | "connecting" | "ready" | "error";

const Chat = () => {
  const [profileOpen, setProfileOpen] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (displayName.trim() && !profileOpen) {
      setProfileReady(true);
    } else {
      setProfileReady(false);
    }
  }, [displayName, profileOpen]);

  const [selectedHand, setSelectedHand] = useState<ApiSafeHand | null>(null);
  const [chatStatus, setChatStatus] = useState<ChatStatus>("idle");
  const [handList, setHandList] = useState<ApiSafeHand[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const handRef = useRef<Hand | null>(null);
  const apiSafeHandRef = useRef<ApiSafeHand | null>(null);

  // -----------------------------
  // Register + WebSocket lifecycle
  // -----------------------------
  const hasRegisteredRef = useRef(false);
  useEffect(() => {
    if (!profileReady){
      return;
    }

    if (hasRegisteredRef.current) return;
    hasRegisteredRef.current = true;

    let active = true;
    async function init() {
      try {
        if (!active) return;

        // Generate keys
        const keyPair = await generateRSAKeys();
        const signKeyPair = await generateRSASigningKeys();

        const apiSafeHand: ApiSafeHand = {
          key: null,
          uuid: null,
          avatarUrl: avatarUrl,
          name: displayName,
          publicKey: await exportPublicKey(keyPair.publicKey),
          publicSignKey: await exportPublicKey(signKeyPair.publicKey)
        };

        // Register hand
        console.log("Registering hand:", apiSafeHand);
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
        apiSafeHandRef.current = apiSafeHand;

        handRef.current = {
          key: apiSafeHand.key,
          uuid: apiSafeHand.uuid,
          avatarUrl: apiSafeHand.avatarUrl,
          name: apiSafeHand.name,
          publicKey: keyPair.publicKey,
          publicSignKey: signKeyPair.publicKey,
          keyPair,
          signKeyPair
        };

        // Open WebSocket
        console.log("Connecting to Secure WebSocket...");
        const ws = new WebSocket("ws://localhost:3000");
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              uuid: apiSafeHand.uuid
            })
          );
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === "peerList") {
            setHandList(data.peers.filter((h: ApiSafeHand) => h.uuid !== handRef.current?.uuid));
          }
        };

        ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          setChatStatus("error");
        };

        ws.onclose = () => {
          console.log("WebSocket closed");
        };
      } catch (err) {
        console.error(err);
        setChatStatus("error");
      }
    }

    init();

    return () => {
      active = false;
      wsRef.current?.close();
    };
  }, [profileReady, avatarUrl, displayName]);

  // -----------------------------
  // Selection logic
  // -----------------------------
  const handleSetSelectedHand = (hand: ApiSafeHand | null) => {
    if (!hand) {
      setSelectedHand(null);
      setHandList(prev => prev.map(h => ({ ...h, selected: false })));
      return;
    }

    setSelectedHand({ ...hand, selectable: false });
  };

  const handleSelectHand = async (handId: number | null) => {
    if (handId === null) {
      handleSetSelectedHand(null);
      return;
    }
    const hand = handList.find(h => h.uuid === handId);
    if (!hand) return;

    setHandList(prev =>
      prev.map(h => ({ ...h, selected: h.uuid === handId }))
    );

    if (selectedHand?.uuid === hand.uuid) {
      handleSetSelectedHand(null);
      return;
    }

    setChatStatus("connecting");

    try {
      handleSetSelectedHand(hand);

      // const response = await fetch("/api/chat/handshake", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     handId: hand.uuid,
      //     publicKey: hand.publicKey,
      //     publicSignKey: hand.publicSignKey
      //   })
      // });

      // if (!response.ok) {
      //   throw new Error("Handshake failed");
      // }

      // await response.json();
      setChatStatus("ready");
    } catch (err) {
      console.error(err);
      setChatStatus("error");
    }
  };

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
          <Box sx={{ p: 3.5, borderBottom: "1px solid #e0e0e0" }}>
            <Typography variant="h6">Lobby</Typography>
          </Box>

          <HandsListComponent
            handList={handList}
            onSelectHand={handleSelectHand}
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
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <HandComponent hand={selectedHand} chatStatus={chatStatus} />
            <Button variant="contained">Rotate keys</Button>
          </Box>

          <MessagesBubbleListComponent
            selectedHand={selectedHand}
            chatStatus={chatStatus}
            wsRef={wsRef}
            ownHand={handRef.current}
          />
        </Box>
      </Box>
      <Dialog open={profileOpen} maxWidth="xs" fullWidth>
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
            variant="contained"
            disabled={!displayName.trim()}
            onClick={() => setProfileOpen(false)}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
