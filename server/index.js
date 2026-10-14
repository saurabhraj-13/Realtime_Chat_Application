const crypto = require("crypto");
const authRoutes = require("./routes/auth");
const deviceTransferRoutes = require("./routes/deviceTransfer");
const chatShareRoutes = require("./routes/chatShare");
const Message = require("./models/Message");
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// =====================================================
// AUTH ROUTES
// =====================================================

app.use("/api/auth", authRoutes);
app.use("/api/device-transfer", deviceTransferRoutes);
app.use("/api/chat-share", chatShareRoutes);


// =====================================================
// BASIC ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.send("🚀 ChatWave server is running");
});


// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


/* =====================================================
   ONLINE USERS
===================================================== */

const onlineUsers = new Map();
const activeSOS = new Map();
const activeLiveLocations = new Map();
// Temporary QR Quick Chat sessions.
// These sessions are stored only in server memory, never in MongoDB.
const quickChatSessions = new Map();

function closeQuickChatSession(sessionId, reason = "closed") {
  const session = quickChatSessions.get(sessionId);

  if (!session) return;

  clearTimeout(session.expiryTimer);

  io.to(`quickchat:${sessionId}`).emit("quick_chat_closed", {
    sessionId,
    reason
  });

  io.in(`quickchat:${sessionId}`).socketsLeave(
    `quickchat:${sessionId}`
  );

  quickChatSessions.delete(sessionId);

  console.log("Temporary QR chat ended:", sessionId, reason);
}

const normalizeUsername = (username) => {
  if (!username || typeof username !== "string") {
    return "";
  }

  return username.trim().toLowerCase();
};

const broadcastUsers = () => {
  io.emit("users", Array.from(onlineUsers.keys()));
};

/* =====================================================
   SOCKET CONNECTION
===================================================== */

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* JOIN */

  socket.on("join", (username) => {
    const cleanUsername = normalizeUsername(username);

    if (!cleanUsername) return;

    socket.username = cleanUsername;

    onlineUsers.set(cleanUsername, socket.id);

    console.log(`${cleanUsername} joined ChatWave`);

    socket.emit("active_sos", Array.from(activeSOS.values()));

    socket.emit(
      "active_live_locations",
      Array.from(activeLiveLocations.values())
    );

    broadcastUsers();
  });

  
  /* LOAD SAVED GLOBAL CHAT MESSAGES */

  socket.on("get_messages", async () => {
    try {
      const messages = await Message.find({
        chatType: "global"
      })
        .sort({ time: 1 })
        .limit(200)
        .lean();

      socket.emit("old_messages", messages);
    } catch (error) {
      console.error("Load global messages error:", error);
    }
  });

  /* =====================================================
     REAL-TIME MESSAGES — SAVE TO MONGODB
  ===================================================== */

  socket.on("message", async (data) => {
    try {
      if (!data || !data.user || data.message == null) {
        return;
      }

      const chatType = data.chatType || "global";
      const sender = normalizeUsername(data.user);

      if (!sender) return;

      const messageData = {
        user: sender,
        message: data.message,
        chatType,
        time: data.time ? new Date(data.time) : new Date(),
        receiver: null,
        groupId: null
      };

      if (chatType === "private") {
        const receiver = normalizeUsername(data.receiver);

        if (!receiver || receiver === sender) return;

        messageData.receiver = receiver;
      } else if (chatType === "group") {
        if (!data.groupId) return;

        messageData.groupId = String(data.groupId);
      } else if (chatType !== "global") {
        return;
      }

      // Save the message before broadcasting it.
      const savedMessage = await Message.create(messageData);
      const messageToSend = savedMessage.toObject();

      if (chatType === "global") {
        io.emit("message", messageToSend);
        return;
      }

      if (chatType === "private") {
        const senderSocketId = onlineUsers.get(sender);
        const receiverSocketId = onlineUsers.get(messageData.receiver);

        if (senderSocketId) {
          io.to(senderSocketId).emit("private_message", messageToSend);
        }

        if (receiverSocketId && receiverSocketId !== senderSocketId) {
          io.to(receiverSocketId).emit("private_message", messageToSend);
        }

        return;
      }

      if (chatType === "group") {
        io.to(`group:${messageData.groupId}`).emit(
          "group_message",
          messageToSend
        );
      }
    } catch (error) {
      console.error("Message save/send error:", error);
    }
  });

  
  /* =====================================================
     CLEAR CHAT MESSAGES FOR EVERYONE
  ===================================================== */


socket.on("clear_chat", async (data = {}) => {
  try {
    const requester = normalizeUsername(socket.username);

    if (!requester) {
      socket.emit("clear_chat_error", {
        message: "Unable to identify your ChatWave account. Please reconnect."
      });
      return;
    }

    // Clear global chat for everyone
    if (data.chatType === "global") {
      const result = await Message.deleteMany({
        chatType: "global"
      });

      io.emit("chat_cleared", {
        chatType: "global"
      });

      console.log("Global messages deleted:", result.deletedCount);
      return;
    }

    // Clear the private conversation between two users
    if (data.chatType === "private") {
      const otherUser = normalizeUsername(data.withUser);

      if (!otherUser || otherUser === requester) {
        socket.emit("clear_chat_error", {
          message: "Please select a valid private conversation."
        });
        return;
      }

      const result = await Message.deleteMany({
        chatType: "private",
        $or: [
          { user: requester, receiver: otherUser },
          { user: otherUser, receiver: requester }
        ]
      });

      const eventData = {
        chatType: "private",
        users: [requester, otherUser]
      };

      // Clear the sender's display
      socket.emit("chat_cleared", eventData);

      // Clear the other user's display if they are online
      const otherSocketId = onlineUsers.get(otherUser);

      if (otherSocketId && otherSocketId !== socket.id) {
        io.to(otherSocketId).emit("chat_cleared", eventData);
      }

      console.log("Private messages deleted:", result.deletedCount);
      return;
    }

    // Clear messages from a group
    if (data.chatType === "group") {
      const groupId = String(data.groupId || "").trim();

      if (!groupId || !socket.rooms.has(`group:${groupId}`)) {
        socket.emit("clear_chat_error", {
          message: "Please open a group you have joined."
        });
        return;
      }

      const result = await Message.deleteMany({
        chatType: "group",
        groupId
      });

      io.to(`group:${groupId}`).emit("chat_cleared", {
        chatType: "group",
        groupId
      });

      console.log("Group messages deleted:", result.deletedCount);
      return;
    }

    socket.emit("clear_chat_error", {
      message: "Unsupported conversation type."
    });
  } catch (error) {
    console.error("Clear chat error:", error);

    socket.emit("clear_chat_error", {
      message: "Unable to delete messages. Please try again."
    });
  }
});
  /* JOIN GROUP */

  socket.on("join_group", (groupId) => {
    if (!groupId) return;

    socket.join(`group:${groupId}`);

    socket.emit("group_joined", { groupId });
  });

  /* LEAVE GROUP */

  socket.on("leave_group", (groupId) => {
    if (!groupId) return;

    socket.leave(`group:${groupId}`);
  });

  /* TYPING */

  socket.on("typing", (data) => {
    if (typeof data === "string") {
      socket.broadcast.emit("typing", data);
      return;
    }

    if (!data || !data.user) return;

    const sender = normalizeUsername(data.user);

    if (data.chatType === "private" && data.receiver) {
      const receiverSocketId = onlineUsers.get(
        normalizeUsername(data.receiver)
      );

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", {
          user: sender,
          chatType: "private",
        });
      }

      return;
    }

    if (data.chatType === "group" && data.groupId) {
      socket.to(`group:${data.groupId}`).emit("typing", {
        user: sender,
        chatType: "group",
        groupId: data.groupId,
      });

      return;
    }

    socket.broadcast.emit("typing", sender);
  });

  /* STOP TYPING */

  socket.on("stop_typing", (data) => {
    if (typeof data === "string") {
      socket.broadcast.emit("stop_typing", data);
      return;
    }

    if (!data || !data.user) return;

    const sender = normalizeUsername(data.user);

    if (data.chatType === "private" && data.receiver) {
      const receiverSocketId = onlineUsers.get(
        normalizeUsername(data.receiver)
      );

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stop_typing", {
          user: sender,
          chatType: "private",
        });
      }

      return;
    }

    if (data.chatType === "group" && data.groupId) {
      socket.to(`group:${data.groupId}`).emit("stop_typing", {
        user: sender,
        chatType: "group",
        groupId: data.groupId,
      });

      return;
    }

    socket.broadcast.emit("stop_typing", sender);
  });

  /* LIVE LOCATION */

  socket.on("live_location", (data) => {
    if (
      !data ||
      !data.user ||
      data.latitude === undefined ||
      data.longitude === undefined
    ) {
      return;
    }

    const locationData = {
      type: "live_location",
      user: normalizeUsername(data.user),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      time: data.time || new Date().toISOString(),
    };

    activeLiveLocations.set(locationData.user, locationData);

    io.emit("live_location", locationData);
  });

  /* STOP LIVE LOCATION */

  socket.on("live_location_stop", (data) => {
    if (!data || !data.user) return;

    const user = normalizeUsername(data.user);

    activeLiveLocations.delete(user);

    io.emit("live_location_stop", { user });
  });

  /* SOS ALERT */

  socket.on("sos_alert", (data) => {
    if (
      !data ||
      !data.user ||
      data.latitude === undefined ||
      data.longitude === undefined
    ) {
      return;
    }

    const user = normalizeUsername(data.user);

    const sosData = {
      type: "sos_alert",
      user,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      time: data.time || new Date().toISOString(),
    };

    activeSOS.set(user, sosData);

    activeLiveLocations.set(user, {
      type: "live_location",
      user,
      latitude: sosData.latitude,
      longitude: sosData.longitude,
      time: sosData.time,
    });

    io.emit("sos_alert", sosData);
    io.emit("live_location", activeLiveLocations.get(user));
  });

  /* STOP SOS */

  socket.on("sos_stop", (data) => {
    if (!data || !data.user) return;

    const user = normalizeUsername(data.user);

    activeSOS.delete(user);
    activeLiveLocations.delete(user);

    io.emit("sos_stop", { user });
    io.emit("live_location_stop", { user });
  });

  
  // CREATE A TEMPORARY QR CHAT
  socket.on("quick_chat_create", (callback) => {
    const username = normalizeUsername(socket.username);

    if (!username) {
      if (typeof callback === "function") {
        callback({ ok: false, message: "Please log in first." });
      }
      return;
    }

    const sessionId = crypto.randomBytes(32).toString("hex");
    const room = `quickchat:${sessionId}`;

    const session = {
      owner: username,
      participants: new Map(),
      expiryTimer: null
    };

    session.participants.set(socket.id, username);
    quickChatSessions.set(sessionId, session);

    socket.quickChatId = sessionId;
    socket.join(room);

    session.expiryTimer = setTimeout(() => {
      closeQuickChatSession(sessionId, "expired");
    }, 15 * 60 * 1000);

    if (typeof callback === "function") {
      callback({
        ok: true,
        sessionId,
        expiresIn: 15 * 60
      });
    }
  });

  // JOIN USING THE SCANNED QR CODE
  socket.on("quick_chat_join", (data, callback) => {
    const username = normalizeUsername(socket.username);
    const sessionId = data?.sessionId;

    const reply = (result) => {
      if (typeof callback === "function") callback(result);
    };

    if (!username || !/^[a-f0-9]{64}$/i.test(sessionId || "")) {
      reply({ ok: false, message: "Invalid QR session." });
      return;
    }

    const session = quickChatSessions.get(sessionId);

    if (!session) {
      reply({
        ok: false,
        message: "This QR chat has expired or been closed."
      });
      return;
    }

    if (session.participants.has(socket.id)) {
      reply({ ok: true, sessionId });
      return;
    }

    if (username === session.owner) {
      reply({
        ok: false,
        message: "Scan this QR from the other user's account."
      });
      return;
    }

    if (session.participants.size >= 2) {
      reply({
        ok: false,
        message: "This temporary chat already has two participants."
      });
      return;
    }

    session.participants.set(socket.id, username);
    socket.quickChatId = sessionId;
    socket.join(`quickchat:${sessionId}`);

    io.to(`quickchat:${sessionId}`).emit("quick_chat_ready", {
      sessionId,
      participants: Array.from(session.participants.values())
    });

    reply({ ok: true, sessionId });
  });

  // SEND A TEMPORARY TEXT MESSAGE — NO MONGODB SAVE
  socket.on("quick_chat_message", (data) => {
    const sessionId = data?.sessionId;
    const session = quickChatSessions.get(sessionId);

    if (
      !session ||
      !session.participants.has(socket.id) ||
      typeof data?.message !== "string"
    ) {
      return;
    }

    const message = data.message.trim();

    if (!message || message.length > 4000) return;

    io.to(`quickchat:${sessionId}`).emit("quick_chat_message", {
      sessionId,
      user: normalizeUsername(socket.username),
      message,
      time: new Date().toISOString()
    });
  });

  // CLOSE THE TEMPORARY CHAT FOR BOTH USERS
  socket.on("quick_chat_close", (data) => {
    const sessionId = data?.sessionId;
    const session = quickChatSessions.get(sessionId);

    if (session && session.participants.has(socket.id)) {
      closeQuickChatSession(sessionId, "closed");
    }
  });

  /* DISCONNECT */

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.quickChatId) {
  const session = quickChatSessions.get(socket.quickChatId);

  if (session && session.participants.has(socket.id)) {
    closeQuickChatSession(socket.quickChatId, "disconnected");
  }
}

    if (socket.username) {
      const username = normalizeUsername(socket.username);

      // Don't remove a newer connection for the same username.
      if (onlineUsers.get(username) === socket.id) {
        onlineUsers.delete(username);

        activeLiveLocations.delete(username);
        activeSOS.delete(username);

        io.emit("live_location_stop", { user: username });
        io.emit("sos_stop", { user: username });
      }
    }

    broadcastUsers();
  });
});

/* =====================================================
   MONGODB — KEEP FOR USER ACCOUNTS
===================================================== */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`ChatWave server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
