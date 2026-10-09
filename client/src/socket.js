import { io } from "socket.io-client";
const SOCKET_URL=process.env.REACT_APP_API_URL||"https://realtime-chat-application-2-3aeu.onrender.com";
const socket=io(SOCKET_URL,{
autoConnect:true,
transports:["websocket","polling"]
});
socket.on("connect",()=>{
console.log("Connected to ChatWave server:",socket.id);
});
socket.on("connect_error",(error)=>{
console.error("Socket connection error:",error.message);
});
export default socket;