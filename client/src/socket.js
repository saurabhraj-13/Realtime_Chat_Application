
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://realtime-chat-application-2-3aeu.onrender.com");

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"]
});

socket.on("connect", () => {
  console.log("Connected to ChatWave server:", SOCKET_URL, socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

export default socket;
