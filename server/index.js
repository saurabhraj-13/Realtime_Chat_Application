require("dotenv").config();

const mongoose = require("mongoose");
const Message = require("./models/Message");

const express = require("express");
const http = require("http");

const {
  Server
} = require("socket.io");

const app = express();

const server =
  http.createServer(app);


const io =
  new Server(server, {

    cors: {

      origin: "*",

      methods: [
        "GET",
        "POST"
      ]

    }

  });


let users = [];


// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {

  res.send(
    "🚀 ChatWave server is running"
  );

});


// =========================
// SOCKET CONNECTION
// =========================

io.on(
  "connection",
  (socket) => {

    console.log(
      "User Connected:",
      socket.id
    );


    // =========================
    // OLD MESSAGES
    // =========================

    Message.find()
      .sort({
        time: 1
      })
      .then(
        (messages) => {

          socket.emit(
            "old_messages",
            messages
          );

        }
      )
      .catch(
        (error) => {

          console.log(
            "Error loading messages:",
            error
          );

        }
      );


    // =========================
    // JOIN
    // =========================

    socket.on(
      "join",
      (username) => {

        username =
          username.trim();


        if (!username) {
          return;
        }


        // Duplicate check

        const exists =
          users.some(
            (user) =>
              user.toLowerCase() ===
              username.toLowerCase()
          );


        if (exists) {

          socket.emit(
            "name_exists"
          );

          return;

        }


        // Add user

        users.push(
          username
        );

        socket.username =
          username;


        // Tell user success

        socket.emit(
          "join_success",
          username
        );


        // Update all users

        io.emit(
          "users",
          users
        );


        console.log(
          `${username} joined`
        );

      }
    );


    // =========================
    // SEND MESSAGE
    // =========================

    socket.on(
      "message",
      async (data) => {

        try {

          if (
            !data.user ||
            !data.message
          ) {
            return;
          }


          const newMessage =
            new Message({

              user:
                data.user,

              message:
                data.message,

              time:
                data.time
                  ? new Date(
                      data.time
                    )
                  : new Date()

            });


          await newMessage.save();


          // Send saved message

          io.emit(
            "message",
            {

              _id:
                newMessage._id,

              user:
                newMessage.user,

              message:
                newMessage.message,

              time:
                newMessage.time

            }
          );


        } catch (error) {

          console.log(
            "Message save error:",
            error
          );

        }

      }
    );


    // =========================
    // TYPING
    // =========================

    socket.on(
      "typing",
      (name) => {

        socket.broadcast.emit(
          "typing",
          name
        );

      }
    );


    // =========================
    // STOP TYPING
    // =========================

    socket.on(
      "stop_typing",
      (name) => {

        socket.broadcast.emit(
          "stop_typing",
          name
        );

      }
    );


    // =========================
    // DISCONNECT
    // =========================

    socket.on(
      "disconnect",
      () => {

        if (
          socket.username
        ) {

          users =
            users.filter(
              (user) =>
                user !==
                socket.username
            );


          io.emit(
            "users",
            users
          );


          console.log(
            `${socket.username} disconnected`
          );

        }

      }
    );

  }
);


// =========================
// MONGODB
// =========================

const MONGODB_URI =
  process.env.MONGODB_URI;


if (!MONGODB_URI) {

  console.error(
    "❌ MONGODB_URI is missing in .env"
  );

  process.exit(1);

}


mongoose
  .connect(
    MONGODB_URI
  )
  .then(() => {

    console.log(
      "✅ MongoDB Connected"
    );


    // =========================
    // SERVER
    // =========================

    const PORT =
      process.env.PORT ||
      5000;


    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `🚀 Server running on port ${PORT}`
        );


        if (
          String(PORT) ===
          "5000"
        ) {

          console.log(
            "👉 http://localhost:5000"
          );

        }

      }
    );

  })
  .catch(
    (error) => {

      console.error(
        "❌ MongoDB Connection Error:"
      );

      console.error(
        error.message
      );

      process.exit(1);

    }
  );