import React, { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_ID = "chatwave-quick-chat-scanner";

function ChatShare({ onClose, socket }) {
  const [mode, setMode] = useState("choose");
  const [sessionId, setSessionId] = useState("");
  const [previousMode, setPreviousMode] = useState("choose");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const messagesEndRef = useRef(null);


  useEffect(() => {
    if (!socket) return;

    const handleReady = (data) => {
      if (data.sessionId !== sessionId) return;

      setParticipants(data.participants || []);
      setMode("chat");
      setError("");
    };

    const handleMessage = (data) => {
      if (data.sessionId !== sessionId) return;

      setMessages((previous) => [...previous, data]);
    };

    const handleClosed = (data) => {
      if (data.sessionId !== sessionId) return;

      setMessages([]);
      setMessage("");
      setMode("ended");
      setError(
        data.reason === "expired"
          ? "This QR chat has expired."
          : "This temporary chat has ended."
      );
    };

    socket.on("quick_chat_ready", handleReady);
    socket.on("quick_chat_message", handleMessage);
    socket.on("quick_chat_closed", handleClosed);

    return () => {
      socket.off("quick_chat_ready", handleReady);
      socket.off("quick_chat_message", handleMessage);
      socket.off("quick_chat_closed", handleClosed);
    };
  }, [socket, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  
const createSession = () => {
  if (!socket?.connected) {
    setError("ChatWave is not connected. Please reconnect and try again.");
    return;
  }

  setLoading(true);
  setError("");

  socket.emit("quick_chat_create", (result) => {
    setLoading(false);

    if (!result?.ok) {
      setError(result?.message || "Could not create QR chat.");
      return;
    }

    setPreviousMode("chat");
setSessionId(result.sessionId);
setMode("show");
  });
};

const createAnotherSession = () => {
  if (!socket?.connected) {
    setError("ChatWave is not connected. Please reconnect and try again.");
    return;
  }

  setLoading(true);
  setError("");

  socket.emit("quick_chat_create", (result) => {
    setLoading(false);

    if (!result?.ok) {
      setError(result?.message || "Could not create another QR chat.");
      return;
    }

    setSessionId(result.sessionId);
    setMode("show");
  });
};


  const joinSession = (scannedSessionId) => {
    if (!socket?.connected) {
      setError("ChatWave is not connected. Please reconnect and try again.");
      return;
    }

    setLoading(true);
    setError("");

    socket.emit(
      "quick_chat_join",
      { sessionId: scannedSessionId },
      (result) => {
        setLoading(false);

        if (!result?.ok) {
          setError(result?.message || "Could not join QR chat.");
          return;
        }

        setSessionId(result.sessionId);
        setMessages([]);
        setMode("chat");
      }
    );
  };

  const startScanner = () => {
    setError("");
    setMode("scan");
  };

  useEffect(() => {
    if (mode !== "scan") return;

    let cancelled = false;
    let alreadyRead = false;
    let scanner;

    const start = async () => {
      try {
        scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (cancelled || alreadyRead) return;

            let scannedSessionId = "";

            try {
              const parsed = JSON.parse(decodedText);
              scannedSessionId = parsed.sessionId || "";
            } catch {
              scannedSessionId = decodedText.trim();
            }

            if (!/^[a-f0-9]{64}$/i.test(scannedSessionId)) {
              setError("This is not a valid ChatWave Quick Chat QR.");
              return;
            }

            alreadyRead = true;

            try {
              if (scanner.isScanning) await scanner.stop();
            } catch {}

            if (!cancelled) joinSession(scannedSessionId);
          },
          () => {}
        );
      } catch {
        if (!cancelled) {
          setError(
            "Unable to start camera. Allow camera access and try again."
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;

      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }

      scannerRef.current = null;
    };
  }, [mode]);

  const sendMessage = () => {
    const text = message.trim();

    if (!text || !sessionId || !socket?.connected) return;

    socket.emit("quick_chat_message", {
      sessionId,
      message: text
    });

    setMessage("");
  };

  const closeQuickChat = () => {
    if (sessionId && socket?.connected) {
      socket.emit("quick_chat_close", { sessionId });
    }

    setMessages([]);
    setMessage("");
    onClose();
  };

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <h2 style={{ marginTop: 0 }}>💬 ChatWave Quick Chat</h2>
        {mode === "choose" && (
          <>
            <p>
              Create a temporary QR chat or scan another user's QR code.
              Messages are not saved to MongoDB.
            </p>

            <button
              style={buttonStyle}
              disabled={loading}
              onClick={createSession}
            >
              {loading ? "Creating..." : "Generate QR Code"}
            </button>

            <button
              style={secondaryStyle}
              disabled={loading}
              onClick={startScanner}
            >
              Scan QR Code
            </button>
          </>
        )}

        {mode === "show" && (
          <>
            <p>
              Ask the other ChatWave user to scan this QR code.
              Keep this window open until they join.
            </p>

            <div style={qrStyle}>
              <QRCode
                value={JSON.stringify({ sessionId })}
                size={220}
              />
            </div>

            <p style={{ textAlign: "center", color: "#666" }}>
              Waiting for the other user to join...
            </p>

           
<button
  style={secondaryStyle}
  onClick={() => {
    setError("");
    setMode(previousMode);
  }}
>
  Cancel QR Chat
</button>

          </>
        )}

        {mode === "scan" && (
          <>
            <p>Allow camera access and scan the other user's QR code.</p>

            <div
              id={SCANNER_ID}
              style={{ width: "100%", minHeight: 220 }}
            />

            {loading && <p>Joining chat...</p>}

            <button
              style={secondaryStyle}
              onClick={() => setMode("choose")}
              disabled={loading}
            >
              Back
            </button>
          </>
        )}

        {mode === "chat" && (
          <>
            <p style={{ color: "#16803d", fontSize: 13 }}>
              ● Temporary chat connected
            </p>

            {participants.length > 0 && (
              <p style={{ color: "#666", fontSize: 13 }}>
                Participants: {participants.join(", ")}
              </p>
            )}

            <div style={messagesStyle}>
              {messages.length === 0 && (
                <p style={{ color: "#777", textAlign: "center" }}>
                  No messages yet. Say hello!
                </p>
              )}
               
{messages.map((item, index) => {
  const myUsername = (
    localStorage.getItem("username") || ""
  ).trim().toLowerCase();

  const isMine =
    (item.user || "").trim().toLowerCase() === myUsername;

  return (
    <div
      key={`${item.time}-${index}`}
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        marginBottom: 10,
        width: "100%"
      }}
    >
      <div
        style={{
          ...bubbleStyle,
          background: isMine ? "#d9fdd3" : "#f1f1f1",
          maxWidth: "80%",
          minWidth: 100
        }}
      >
        <strong>{item.user}</strong>

        <div style={{ marginTop: 5, overflowWrap: "anywhere" }}>
          {item.message}
        </div>

        <small style={{ color: "#777" }}>
          {new Date(item.time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </small>
      </div>
    </div>
  );
})}

              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder="Type a message..."
                maxLength={4000}
                style={inputStyle}
              />

              <button style={buttonStyle} onClick={sendMessage}>
                Send
              </button>
            </div>

<button
  style={secondaryStyle}
  disabled={loading}
  onClick={createAnotherSession}
>
  ➕ Generate Another QR Code
</button>

            <button
              style={dangerStyle}
              onClick={closeQuickChat}
            >
              Close Chat & Clear Messages
            </button>
          </>
        )}

        {mode === "ended" && (
          <>
            <p>{error || "This temporary chat has ended."}</p>
            <button style={buttonStyle} onClick={onClose}>
              Done
            </button>
          </>
        )}

        {error && mode !== "ended" && (
          <p role="alert" style={{ color: "#c62828", overflowWrap: "anywhere" }}>
            {error}
          </p>
        )}

        {mode !== "chat" && mode !== "ended" && (
          <button
            style={secondaryStyle}
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(0,0,0,.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16
};

const dialogStyle = {
  background: "#fff",
  color: "#222",
  borderRadius: 16,
  padding: 22,
  width: "100%",
  maxWidth: 520,
  maxHeight: "90vh",
  overflowY: "auto",
  boxSizing: "border-box"
};

const qrStyle = {
  display: "flex",
  justifyContent: "center",
  padding: 16,
  background: "#fff"
};

const messagesStyle = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 12,
  height: 280,
  overflowY: "auto",
  background: "#f8fafc"
};

const bubbleStyle = {
  padding: 10,
  marginBottom: 8,
  borderRadius: 8,
  background: "#e8f5e9",
  overflowWrap: "anywhere"
};

const inputStyle = {
  flex: 1,
  minWidth: 0,
  padding: 11,
  border: "1px solid #ccc",
  borderRadius: 8
};

const buttonStyle = {
  padding: 12,
  marginTop: 8,
  border: 0,
  borderRadius: 8,
  background: "#25d366",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer"
};

const secondaryStyle = {
  width: "100%",
  padding: 11,
  marginTop: 8,
  border: "1px solid #ddd",
  borderRadius: 8,
  background: "#f5f5f5",
  color: "#222",
  fontWeight: 600,
  cursor: "pointer"
};

const dangerStyle = {
  ...secondaryStyle,
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca"
};

export default ChatShare;
