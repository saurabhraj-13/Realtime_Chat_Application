
import React from "react";

function ChatHeader({
  username,
  selectedUser,
  chatMode,
  groupId,
  connected,
  users = [],
  getAvatar,
  onDeviceTransfer,
  darkMode,
  toggleTheme
}) {
  const getChatTitle = () => {
    if (chatMode === "private") {
      return `Chat with ${selectedUser}`;
    }

    if (chatMode === "group") {
      return `Group: ${groupId}`;
    }

    return "Global Chat";
  };

  const headerUsername =
    chatMode === "private" ? selectedUser : username;

  return (
    <header className="chat-header">
      <div className="header-user">
        <div className="avatar small-avatar">
          {getAvatar(headerUsername)}
        </div>

        <div>
          <h2>{getChatTitle()}</h2>

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
          type="button"
          onClick={onDeviceTransfer}
          title="Transfer to New Device"
          style={{
            marginLeft: "10px",
            padding: "8px 12px",
            border: 0,
            borderRadius: "8px",
            background: "#25d366",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          📱 Transfer
        </button>

        <button
          type="button"
          className="mobile-theme-btn"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;