import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("Connected to local ChatWave server:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error.message);
});

export default socket;