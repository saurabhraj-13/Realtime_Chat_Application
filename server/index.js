require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const Message = require("./models/Message");
const authRoutes = require("./routes/auth");
const deviceTransferRoutes = require("./routes/deviceTransfer");

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


// =====================================================
// ONLINE USERS
// =====================================================

// username -> socket.id
const onlineUsers = new Map();


// =====================================================
// ACTIVE SOS / LIVE LOCATION
// =====================================================

// username -> SOS data
const activeSOS = new Map();

// username -> live location data
const activeLiveLocations = new Map();


// =====================================================
// NORMALIZE USERNAME
// =====================================================

const normalizeUsername = (username) => {
  if (!username || typeof username !== "string") {
    return "";
  }

  return username.trim().toLowerCase();
};


// =====================================================
// BROADCAST ONLINE USERS
// =====================================================

const broadcastUsers = () => {
  io.emit(
    "users",
    Array.from(onlineUsers.keys())
  );
};


// =====================================================
// SEND GLOBAL MESSAGE HISTORY
// =====================================================

const sendGlobalMessages = async (socket) => {
  try {
    const messages = await Message.find({
      $or: [
        {
          chatType: "global",
        },
        {
          chatType: {
            $exists: false,
          },
        },
      ],
    })
      .sort({
        createdAt: 1,
      })
      .limit(200);

    socket.emit(
      "old_messages",
      messages
    );
  } catch (error) {
    console.error(
      "Error loading global messages:",
      error
    );
  }
};


// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on(
  "connection",
  async (socket) => {

    console.log(
      "User connected:",
      socket.id
    );


    // =================================================
    // JOIN
    // =================================================

    socket.on(
      "join",
      async (username) => {

        try {

          const cleanUsername =
            normalizeUsername(
              username
            );

          if (!cleanUsername) {
            return;
          }

          socket.username =
            cleanUsername;

          // Store normalized username
          onlineUsers.set(
            cleanUsername,
            socket.id
          );

          console.log(
            `${cleanUsername} joined ChatWave`
          );

          // Send global chat history
          await sendGlobalMessages(
            socket
          );

          // Send active SOS
          socket.emit(
            "active_sos",
            Array.from(
              activeSOS.values()
            )
          );

          // Send active live locations
          socket.emit(
            "active_live_locations",
            Array.from(
              activeLiveLocations.values()
            )
          );

          // Update online users
          broadcastUsers();

        } catch (error) {

          console.error(
            "Join error:",
            error
          );

        }
      }
    );


    // =================================================
    // NORMAL MESSAGE
    // GLOBAL / PRIVATE / GROUP
    // =================================================

    socket.on(
      "message",
      async (data) => {

        try {

          if (
            !data ||
            !data.user ||
            data.message == null
          ) {
            return;
          }

          const chatType =
            data.chatType ||
            "global";


          // ===========================================
          // GLOBAL CHAT
          // ===========================================

          if (
            chatType === "global"
          ) {

            const sender =
              normalizeUsername(
                data.user
              );

            const messageData = {

              user: sender,

              message:
                data.message,

              chatType:
                "global",

              receiver:
                null,

              groupId:
                null,

              time:
                data.time ||
                new Date(),
            };

            const newMessage =
              new Message(
                messageData
              );

            await newMessage.save();

            // GLOBAL ONLY
            io.emit(
              "message",
              newMessage
            );

            return;
          }


          // ===========================================
          // PRIVATE CHAT
          // ===========================================

          if (
            chatType === "private"
          ) {

            const sender =
              normalizeUsername(
                data.user
              );

            const receiver =
              normalizeUsername(
                data.receiver
              );

            if (!sender) {
              console.log(
                "❌ Private message missing sender"
              );

              return;
            }

            if (!receiver) {
              console.log(
                "❌ Private message missing receiver"
              );

              return;
            }

            if (
              sender === receiver
            ) {
              console.log(
                "❌ Sender and receiver cannot be same"
              );

              return;
            }


            console.log(
              `💬 PRIVATE MESSAGE: ${sender} → ${receiver}`
            );


            // =========================================
            // CREATE PRIVATE MESSAGE
            // =========================================

            const messageData = {

              user:
                sender,

              message:
                data.message,

              chatType:
                "private",

              receiver:
                receiver,

              groupId:
                null,

              time:
                data.time ||
                new Date(),
            };


            const newMessage =
              new Message(
                messageData
              );


            await newMessage.save();


            // =========================================
            // FIND SENDER SOCKET
            // =========================================

            const senderSocketId =
              onlineUsers.get(
                sender
              );


            // =========================================
            // FIND RECEIVER SOCKET
            // =========================================

            const receiverSocketId =
              onlineUsers.get(
                receiver
              );


            console.log(
              "Sender socket:",
              senderSocketId ||
                "NOT FOUND"
            );

            console.log(
              "Receiver socket:",
              receiverSocketId ||
                "NOT FOUND"
            );


            // =========================================
            // SEND ONLY TO SENDER
            // =========================================

            if (
              senderSocketId
            ) {

              io.to(
                senderSocketId
              ).emit(
                "private_message",
                newMessage
              );

            }


            // =========================================
            // SEND ONLY TO RECEIVER
            // =========================================

            if (
              receiverSocketId &&
              receiverSocketId !==
                senderSocketId
            ) {

              io.to(
                receiverSocketId
              ).emit(
                "private_message",
                newMessage
              );

            }


            return;
          }


          // ===========================================
          // GROUP CHAT
          // ===========================================

          if (
            chatType === "group"
          ) {

            if (
              !data.groupId
            ) {

              console.log(
                "Group message missing groupId"
              );

              return;
            }

            const sender =
              normalizeUsername(
                data.user
              );

            const messageData = {

              user:
                sender,

              message:
                data.message,

              chatType:
                "group",

              receiver:
                null,

              groupId:
                data.groupId,

              time:
                data.time ||
                new Date(),
            };


            const newMessage =
              new Message(
                messageData
              );


            await newMessage.save();


            io.to(
              `group:${data.groupId}`
            ).emit(
              "group_message",
              newMessage
            );


            return;
          }

        } catch (error) {

          console.error(
            "❌ Message error:",
            error
          );

        }
      }
    );


    // =================================================
    // PRIVATE CHAT HISTORY
    // =================================================

    socket.on(
      "get_private_messages",
      async (data) => {

        try {

          if (
            !socket.username ||
            !data ||
            !data.withUser
          ) {
            return;
          }

          const currentUser =
            normalizeUsername(
              socket.username
            );

          const otherUser =
            normalizeUsername(
              data.withUser
            );


          console.log(
            `📖 Loading private chat: ${currentUser} ↔ ${otherUser}`
          );


          const messages =
            await Message.find({

              chatType:
                "private",

              $or: [

                {
                  user:
                    currentUser,

                  receiver:
                    otherUser,
                },

                {
                  user:
                    otherUser,

                  receiver:
                    currentUser,
                },

              ],

            })
              .sort({
                createdAt: 1,
              })
              .limit(200);


          socket.emit(
            "private_messages",
            messages
          );

        } catch (error) {

          console.error(
            "Private message history error:",
            error
          );

        }
      }
    );


    // =================================================
    // JOIN GROUP
    // =================================================

    socket.on(
      "join_group",
      (groupId) => {

        if (!groupId) {
          return;
        }

        const roomName =
          `group:${groupId}`;

        socket.join(
          roomName
        );

        console.log(
          `${socket.username || "User"} joined group ${groupId}`
        );

        socket.emit(
          "group_joined",
          {
            groupId,
          }
        );

      }
    );


    // =================================================
    // LEAVE GROUP
    // =================================================

    socket.on(
      "leave_group",
      (groupId) => {

        if (!groupId) {
          return;
        }

        const roomName =
          `group:${groupId}`;

        socket.leave(
          roomName
        );

        console.log(
          `${socket.username || "User"} left group ${groupId}`
        );

      }
    );


    // =================================================
    // GROUP CHAT HISTORY
    // =================================================

    socket.on(
      "get_group_messages",
      async (groupId) => {

        try {

          if (!groupId) {
            return;
          }

          const messages =
            await Message.find({

              chatType:
                "group",

              groupId:
                groupId,

            })
              .sort({
                createdAt: 1,
              })
              .limit(200);


          socket.emit(
            "group_messages",
            {
              groupId,
              messages,
            }
          );

        } catch (error) {

          console.error(
            "Group message history error:",
            error
          );

        }
      }
    );


    // =================================================
    // TYPING
    // =================================================

    socket.on(
      "typing",
      (data) => {

        if (
          typeof data ===
          "string"
        ) {

          socket.broadcast.emit(
            "typing",
            data
          );

          return;
        }


        if (
          !data ||
          !data.user
        ) {
          return;
        }


        const sender =
          normalizeUsername(
            data.user
          );


        // PRIVATE
        if (
          data.chatType ===
            "private" &&
          data.receiver
        ) {

          const receiver =
            normalizeUsername(
              data.receiver
            );

          const receiverSocketId =
            onlineUsers.get(
              receiver
            );

          if (
            receiverSocketId
          ) {

            io.to(
              receiverSocketId
            ).emit(
              "typing",
              {
                user:
                  sender,

                chatType:
                  "private",
              }
            );

          }

          return;
        }


        // GROUP
        if (
          data.chatType ===
            "group" &&
          data.groupId
        ) {

          socket
            .to(
              `group:${data.groupId}`
            )
            .emit(
              "typing",
              {
                user:
                  sender,

                chatType:
                  "group",

                groupId:
                  data.groupId,
              }
            );

          return;
        }


        // GLOBAL
        socket.broadcast.emit(
          "typing",
          sender
        );

      }
    );


    // =================================================
    // STOP TYPING
    // =================================================

    socket.on(
      "stop_typing",
      (data) => {

        if (
          typeof data ===
          "string"
        ) {

          socket.broadcast.emit(
            "stop_typing",
            data
          );

          return;
        }


        if (
          !data ||
          !data.user
        ) {
          return;
        }


        const sender =
          normalizeUsername(
            data.user
          );


        // PRIVATE
        if (
          data.chatType ===
            "private" &&
          data.receiver
        ) {

          const receiver =
            normalizeUsername(
              data.receiver
            );

          const receiverSocketId =
            onlineUsers.get(
              receiver
            );

          if (
            receiverSocketId
          ) {

            io.to(
              receiverSocketId
            ).emit(
              "stop_typing",
              {
                user:
                  sender,

                chatType:
                  "private",
              }
            );

          }

          return;
        }


        // GROUP
        if (
          data.chatType ===
            "group" &&
          data.groupId
        ) {

          socket
            .to(
              `group:${data.groupId}`
            )
            .emit(
              "stop_typing",
              {
                user:
                  sender,

                chatType:
                  "group",

                groupId:
                  data.groupId,
              }
            );

          return;
        }


        // GLOBAL
        socket.broadcast.emit(
          "stop_typing",
          sender
        );

      }
    );


    // =================================================
    // LIVE LOCATION
    // =================================================

    socket.on(
      "live_location",
      (data) => {

        if (
          !data ||
          !data.user ||
          data.latitude ===
            undefined ||
          data.longitude ===
            undefined
        ) {
          return;
        }

        const locationData = {

          type:
            "live_location",

          user:
            normalizeUsername(
              data.user
            ),

          latitude:
            Number(
              data.latitude
            ),

          longitude:
            Number(
              data.longitude
            ),

          time:
            data.time ||
            new Date().toISOString(),

        };


        activeLiveLocations.set(
          locationData.user,
          locationData
        );


        io.emit(
          "live_location",
          locationData
        );

      }
    );


    // =================================================
    // STOP LIVE LOCATION
    // =================================================

    socket.on(
      "live_location_stop",
      (data) => {

        if (
          !data ||
          !data.user
        ) {
          return;
        }

        const user =
          normalizeUsername(
            data.user
          );


        activeLiveLocations.delete(
          user
        );


        io.emit(
          "live_location_stop",
          {
            user,
          }
        );

      }
    );


    // =================================================
    // SOS ALERT
    // =================================================

    socket.on(
      "sos_alert",
      (data) => {

        if (
          !data ||
          !data.user ||
          data.latitude ===
            undefined ||
          data.longitude ===
            undefined
        ) {
          return;
        }

        const user =
          normalizeUsername(
            data.user
          );


        console.log(
          `🚨 SOS ALERT from ${user}`
        );


        const sosData = {

          type:
            "sos_alert",

          user,

          latitude:
            Number(
              data.latitude
            ),

          longitude:
            Number(
              data.longitude
            ),

          time:
            data.time ||
            new Date().toISOString(),

        };


        activeSOS.set(
          user,
          sosData
        );


        activeLiveLocations.set(
          user,
          {
            type:
              "live_location",

            user,

            latitude:
              sosData.latitude,

            longitude:
              sosData.longitude,

            time:
              sosData.time,
          }
        );


        io.emit(
          "sos_alert",
          sosData
        );


        io.emit(
          "live_location",
          activeLiveLocations.get(
            user
          )
        );

      }
    );


    // =================================================
    // STOP SOS
    // =================================================

    socket.on(
      "sos_stop",
      (data) => {

        if (
          !data ||
          !data.user
        ) {
          return;
        }

        const user =
          normalizeUsername(
            data.user
          );


        console.log(
          `🛑 SOS stopped by ${user}`
        );


        activeSOS.delete(
          user
        );


        activeLiveLocations.delete(
          user
        );


        io.emit(
          "sos_stop",
          {
            user,
          }
        );


        io.emit(
          "live_location_stop",
          {
            user,
          }
        );

      }
    );


    // =================================================
    // DISCONNECT
    // =================================================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "User disconnected:",
          socket.id
        );


        if (
          socket.username
        ) {

          const username =
            normalizeUsername(
              socket.username
            );


          if (
            onlineUsers.get(
              username
            ) === socket.id
          ) {

            onlineUsers.delete(
              username
            );

          }


          activeLiveLocations.delete(
            username
          );


          activeSOS.delete(
            username
          );


          io.emit(
            "live_location_stop",
            {
              user:
                username,
            }
          );


          io.emit(
            "sos_stop",
            {
              user:
                username,
            }
          );

        }


        broadcastUsers();

      }
    );

  }
);


// =====================================================
// MONGODB
// =====================================================

mongoose
  .connect(
    process.env.MONGODB_URI
  )
  .then(() => {

    console.log(
      "✅ MongoDB connected"
    );


    const PORT =
      process.env.PORT ||
      5000;


    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `🚀 ChatWave server running on port ${PORT}`
        );

      }
    );

  })
  .catch(
    (error) => {

      console.error(
        "❌ MongoDB connection error:",
        error
      );

    }
  );