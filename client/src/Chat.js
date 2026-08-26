import React, {
  useEffect,
  useRef,
  useState
} from "react";

import socket from "./socket";

function Chat({ username }) {

  const [message, setMessage] = useState("");

  const [messageList, setMessageList] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [typingUser, setTypingUser] =
    useState("");

  const [darkMode, setDarkMode] =
    useState(
      localStorage.getItem("chatTheme") === "dark"
    );

  const [connected, setConnected] =
    useState(socket.connected);

  const messagesRef = useRef(null);

  const typingTimeoutRef = useRef(null);


  // =====================================
  // AVATAR
  // =====================================

  const getAvatar = (name) => {

    if (!name) {
      return "U";
    }

    return name
      .charAt(0)
      .toUpperCase();

  };


  // =====================================
  // FORMAT TIME
  // =====================================

  const formatTime = (time) => {

    if (!time) {
      return "";
    }

    const date = new Date(time);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

  };


  // =====================================
  // LOAD CHAT
  // =====================================

  useEffect(() => {

    // Join room

    socket.emit("join", username);


    // Connection

    const handleConnect = () => {

      setConnected(true);

    };


    const handleDisconnect = () => {

      setConnected(false);

    };


    // Old messages

    const handleOldMessages =
      (messages) => {

        setMessageList(messages);

      };


    // New message

    const handleMessage =
      (data) => {

        setMessageList((list) => [
          ...list,
          data
        ]);

        // Notification for other users

        if (
          data.user !== username &&
          Notification.permission === "granted"
        ) {

          new Notification(
            `${data.user} sent a message`,
            {
              body: data.message
            }
          );

        }

      };


    // Users

    const handleUsers =
      (userList) => {

        setUsers(userList);

      };


    // Typing

    const handleTyping =
      (name) => {

        if (name === username) {
          return;
        }

        setTypingUser(name);

      };


    // Stop typing

    const handleStopTyping = () => {

      setTypingUser("");

    };


    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "old_messages",
      handleOldMessages
    );

    socket.on(
      "message",
      handleMessage
    );

    socket.on(
      "users",
      handleUsers
    );

    socket.on(
      "typing",
      handleTyping
    );

    socket.on(
      "stop_typing",
      handleStopTyping
    );


    return () => {

      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "old_messages",
        handleOldMessages
      );

      socket.off(
        "message",
        handleMessage
      );

      socket.off(
        "users",
        handleUsers
      );

      socket.off(
        "typing",
        handleTyping
      );

      socket.off(
        "stop_typing",
        handleStopTyping
      );

    };

  }, [username]);


  // =====================================
  // AUTO SCROLL
  // =====================================

  useEffect(() => {

    if (messagesRef.current) {

      messagesRef.current.scrollTo({
        top:
          messagesRef.current.scrollHeight,
        behavior: "smooth"
      });

    }

  }, [messageList]);


  // =====================================
  // SEND MESSAGE
  // =====================================

  const sendMessage = () => {

    const text = message.trim();

    if (!text) {
      return;
    }

    const data = {

      user: username,

      message: text,

      time:
        new Date().toISOString()

    };

    socket.emit(
      "message",
      data
    );

    setMessage("");

  };


  // =====================================
  // ENTER TO SEND
  // =====================================

  const handleMessageKeyDown =
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        sendMessage();

      }

    };


  // =====================================
  // TYPING
  // =====================================

  const handleTyping =
    (event) => {

      setMessage(
        event.target.value
      );

      socket.emit(
        "typing",
        username
      );


      clearTimeout(
        typingTimeoutRef.current
      );


      typingTimeoutRef.current =
        setTimeout(() => {

          socket.emit(
            "stop_typing",
            username
          );

        }, 1000);

    };


  // =====================================
  // CLEAR SCREEN
  // =====================================

  const clearChat = () => {

    const confirmClear =
      window.confirm(
        "Clear messages from this screen?\n\nMessages will remain saved in MongoDB."
      );

    if (!confirmClear) {
      return;
    }

    setMessageList([]);

  };


  // =====================================
  // DARK MODE
  // =====================================

  const toggleTheme = () => {

    setDarkMode((previous) => {

      const newMode = !previous;

      localStorage.setItem(
        "chatTheme",
        newMode
          ? "dark"
          : "light"
      );

      return newMode;

    });

  };


  // =====================================
  // NOTIFICATION
  // =====================================

  const enableNotifications =
    async () => {

      if (
        "Notification" in window &&
        Notification.permission === "default"
      ) {

        await Notification.requestPermission();

      }

    };


  // =====================================
  // RENDER
  // =====================================

  return (

    <div
      className={
        darkMode
          ? "chat-container dark"
          : "chat-container"
      }
    >

      {/* =========================
          SIDEBAR
      ========================== */}

      <aside className="sidebar">

        <div className="sidebar-header">

          <div className="app-title">

            <span className="app-icon">
              💬
            </span>

            <span>
              ChatWave
            </span>

          </div>


          <button
            className="theme-btn"
            onClick={toggleTheme}
            title="Toggle theme"
          >

            {darkMode
              ? "☀️"
              : "🌙"}

          </button>

        </div>


        {/* CURRENT USER */}

        <div className="current-user">

          <div className="avatar">

            {getAvatar(username)}

          </div>


          <div className="user-details">

            <strong>
              {username}
            </strong>

            <span className="online-status">
              ● Online
            </span>

          </div>

        </div>


        {/* USERS */}

        <div className="users-section">

          <div className="section-title">

            <span>
              Online Users
            </span>

            <span className="user-count">

              {users.length}

            </span>

          </div>


          <div>

            {users.map(
              (user, index) => (

                <div
                  className="online-user"
                  key={`${user}-${index}`}
                >

                  <span className="user-dot">
                  </span>

                  <span className="online-name">

                    {user}

                  </span>

                </div>

              )
            )}

          </div>

        </div>


        {/* SIDEBAR BUTTONS */}

        <div className="sidebar-bottom">

          <button
            className="clear-btn"
            onClick={clearChat}
          >

            🗑️ Clear Screen

          </button>


          <button
            className="notification-btn"
            onClick={enableNotifications}
          >

            🔔 Notifications

          </button>

        </div>

      </aside>


      {/* =========================
          CHAT AREA
      ========================== */}

      <main className="chat-box">


        {/* HEADER */}

        <header className="chat-header">

          <div className="header-user">

            <div className="avatar small-avatar">

              {getAvatar(username)}

            </div>


            <div>

              <h2>
                Global Chat
              </h2>

              <span
                className={
                  connected
                    ? "connection online"
                    : "connection offline"
                }
              >

                {connected
                  ? `● ${users.length} online`
                  : "● Disconnected"}

              </span>

            </div>

          </div>


          <div className="header-right">

            <span className="header-username">

              @{username}

            </span>


            <button
              className="mobile-theme-btn"
              onClick={toggleTheme}
            >

              {darkMode
                ? "☀️"
                : "🌙"}

            </button>

          </div>

        </header>


        {/* MESSAGES */}

        <div
          className="messages"
          ref={messagesRef}
        >

          {messageList.length === 0 && (

            <div className="empty-chat">

              <div>
                💬
              </div>

              <h3>
                No messages yet
              </h3>

              <p>
                Start the conversation!
              </p>

            </div>

          )}


          {messageList.map(
            (msg, index) => {

              const mine =
                msg.user === username;


              return (

                <div
                  key={
                    msg._id ||
                    `${msg.time}-${index}`
                  }
                  className={
                    mine
                      ? "message-row mine"
                      : "message-row"
                  }
                >

                  {!mine && (

                    <div className="message-avatar">

                      {getAvatar(
                        msg.user
                      )}

                    </div>

                  )}


                  <div className="message-bubble">

                    {!mine && (

                      <div className="message-user">

                        {msg.user}

                      </div>

                    )}


                    <div className="message-text">

                      {msg.message}

                    </div>


                    <div className="message-time">

                      {formatTime(
                        msg.time
                      )}

                    </div>

                  </div>

                </div>

              );

            }
          )}

        </div>


        {/* TYPING */}

        <div className="typing-area">

          {typingUser && (

            <span>

              {typingUser}
              {" "}
              is typing...

            </span>

          )}

        </div>


        {/* INPUT */}

        <div className="input-box">

          <textarea
            value={message}
            onChange={handleTyping}
            onKeyDown={
              handleMessageKeyDown
            }
            placeholder="Type a message..."
            rows="1"
          />


          <button
            className="send-btn"
            onClick={sendMessage}
          >

            ➤

          </button>

        </div>


        <div className="input-hint">

          Press <b>Enter</b> to send •
          <b>Shift + Enter</b> for new line

        </div>

      </main>

    </div>

  );

}

export default Chat;