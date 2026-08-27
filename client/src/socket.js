import { io } from "socket.io-client";

const socket = io("https://realtime-chat-application-2-3aeu.onrender.com");

export default socket;