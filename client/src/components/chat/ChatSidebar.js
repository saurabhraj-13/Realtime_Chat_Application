
import React from "react";

function ChatSidebar({
  username,
  users = [],
  darkMode,
  toggleTheme,
  openGlobalChat,
  openGroupChat,
  openPrivateChat,
  onOpenAccount,
  chatMode,
  startSOS,
  stopSOS,
  activeSOS = {},
  locationLoading,
  clearChat,
  enableNotifications,
  getAvatar
}) {
  const currentUsername = String(username || "").toLowerCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="app-title">
          <span className="app-icon">💬</span>
          <span>ChatWave</span>
        </div>

        <button
          type="button"
          className="theme-btn"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      <button
        type="button"
        className="current-user"
        onClick={onOpenAccount}
        title="View account"
        style={{
          width: "100%",
          textAlign: "left",
          font: "inherit",
          color: "inherit",
          background: "transparent",
          cursor: "pointer"
        }}
      >
        <div className="avatar">{getAvatar(username)}</div>

        <div className="user-details">
          <strong>{username}</strong>
          <span className="online-status">● Online</span>
          <small>View account</small>
        </div>
      </button>

      <div
        style={{
          padding: "10px 15px",
          borderBottom: "1px solid #eee"
        }}
      >
        <button
          type="button"
          onClick={openGlobalChat}
          style={{
            width: "100%",
            padding: "9px",
            marginBottom: "7px",
            border: "none",
            borderRadius: "8px",
            background: chatMode === "global" ? "#25d366" : "#f0f2f5",
            color: chatMode === "global" ? "white" : "#374151",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          🌐 Global Chat
        </button>

        <button
          type="button"
          onClick={openGroupChat}
          style={{
            width: "100%",
            padding: "9px",
            border: "none",
            borderRadius: "8px",
            background: chatMode === "group" ? "#25d366" : "#f0f2f5",
            color: chatMode === "group" ? "white" : "#374151",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          👥 Group Chat
        </button>
      </div>

      <div className="users-section">
        <div className="section-title">
          <span>ONLINE USERS</span>
          <span className="user-count">{users.length}</span>
        </div>

        <div>
          {users.map((user, index) => {
            const isCurrentUser =
              String(user || "").toLowerCase() === currentUsername;

            return (
              <div
                className="online-user"
                key={`${user}-${index}`}
                onClick={() => {
                  if (!isCurrentUser) {
                    openPrivateChat(user);
                  }
                }}
                title={
                  isCurrentUser
                    ? "You"
                    : `Private chat with ${user}`
                }
                style={{
                  cursor: isCurrentUser ? "default" : "pointer"
                }}
              >
                <span className="user-dot" />
                <span className="online-name">
                  {user}
                  {isCurrentUser ? " (You)" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sidebar-bottom">
        {!activeSOS[username] ? (
          <button
            type="button"
            className="sos-button"
            onClick={startSOS}
            disabled={locationLoading}
            title="Emergency SOS"
          >
            🚨 SOS
          </button>
        ) : (
          <button
            type="button"
            className="sos-stop-button"
            onClick={stopSOS}
            title="Stop SOS"
          >
            🛑 Stop SOS
          </button>
        )}

        <button
          type="button"
          className="clear-btn"
          onClick={clearChat}
        >
          🗑️ Clear Screen
        </button>

        <button
          type="button"
          className="notification-btn"
          onClick={enableNotifications}
        >
          🔔 Notifications
        </button>
      </div>
    </aside>
  );
}

export default ChatSidebar;