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
  exportPublicKey,
  signData
} from "../crypto/rsa";
import { ArrayBufferSignatureToBase64 } from "../crypto/transport-codec"

type ChatStatus = "idle" | "connecting" | "ready" | "error";
const API_URL = import.meta.env.VITE_API_URL;

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

  const selectedHandRef = useRef<ApiSafeHand | null>(null);
  const rotatedKeysHandRef = useRef<Hand | null>(null);
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
    const res = await fetch(`${API_URL}/register`, {
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return wsRef.current;

    const ws = new WebSocket(`${API_URL.replace(/^http/, "ws")}`);
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
        setHandList((prevList) =>
          prevList.map((hand) => ({ ...hand, selected: hand.uuid === selectedHandRef.current?.uuid }))
        );
        const updatedSelectedHandArray: ApiSafeHand[] = peers.filter((h) => h.uuid === selectedHandRef.current?.uuid);
        if (updatedSelectedHandArray.length !== 1) return;

        const updatedSelectedHand: ApiSafeHand = updatedSelectedHandArray[0];
        if (selectedHandRef.current?.publicKey !== updatedSelectedHand.publicKey) {
          selectedHandRef.current = updatedSelectedHand;

          setHandList((prevList) =>
            prevList.map((hand) => ({ ...hand, selected: false, selectable: true }))
          );
          setHandList((prevList) =>
            prevList.map((hand) => ({ ...hand, selected: hand.uuid === selectedHandRef.current?.uuid }))
          );
          setSelectedHand(selectedHandRef.current);
        }
      }

      if (data.type === "ROTATE_KEYS_ACK") {
        console.log(data);
        if (rotatedKeysHandRef.current){
          handRef.current = rotatedKeysHandRef.current;
          setOwnHand(rotatedKeysHandRef.current);
          rotatedKeysHandRef.current = null;
          console.log("Keys rotated sucessfully.");
        }
      }

      if (data.type === "ROTATE_KEYS_ERROR") {
        console.log("Error rotating keys: ", data.error);
        rotatedKeysHandRef.current = null;
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed: ", event);
    };

    return ws;
  }, []);

  const rotateKeys = useCallback(async (): Promise<void> => {
    const { apiSafeHand, keyPair, signKeyPair } = await setupLocalHand(ownHand!.name, ownHand!.avatarUrl);
    apiSafeHand.uuid = ownHand!.uuid;
    apiSafeHand.key = ownHand!.key;

    const newHand : Hand = {
      key: apiSafeHand.key,
      uuid: apiSafeHand.uuid,
      avatarUrl: apiSafeHand.avatarUrl,
      name: apiSafeHand.name,
      publicKey: keyPair.publicKey,
      publicSignKey: signKeyPair.publicKey,
      keyPair,
      signKeyPair
    };
    rotatedKeysHandRef.current = newHand;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = {
        publicKey: await exportPublicKey(keyPair.publicKey),
        publicSignKey: await exportPublicKey(signKeyPair.publicKey)
      };

      const signature: ArrayBuffer = await signData(JSON.stringify(payload), ownHand!.signKeyPair!.privateKey);
      const message = {
        type: "ROTATE_KEYS",
        payload,
        signature: ArrayBufferSignatureToBase64(signature)
      };

      wsRef.current.send(JSON.stringify(message));
      return;
    }
  }, [ownHand, setupLocalHand]);

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
      selectedHandRef.current = hand;
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
            <Button 
              variant="contained"
              sx={{ ml: "auto" }}
              onClick={async () => rotateKeys()}
            >
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
