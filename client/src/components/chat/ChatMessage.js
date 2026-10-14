
// client/src/components/chat/ChatMessage.js

import React from "react";

function ChatMessage({
  message,
  username,
  getAvatar,
  formatTime,
  onMessageClick,
}) {
  if (!message) {
    return null;
  }

  const sender =
    message.username ||
    message.sender ||
    "Unknown";

  const isOwnMessage = sender === username;

  const text =
    typeof message.message === "string"
      ? message.message
      : typeof message.text === "string"
      ? message.text
      : "";

  const messageTime =
    message.createdAt ||
    message.timestamp ||
    message.time;

  return (
    <div
      className={`message-row ${
        isOwnMessage ? "own-message" : "other-message"
      }`}
    >
      {!isOwnMessage && (
        <div className="message-avatar">
          {getAvatar ? getAvatar(sender) : sender.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="message-content">
        {!isOwnMessage && (
          <div className="message-sender">
            {sender}
          </div>
        )}

        <div
          className="message-bubble"
          onClick={() => onMessageClick?.(message)}
        >
          <p>{text}</p>

          <div className="message-meta">
            <span>
              {formatTime ? formatTime(messageTime) : ""}
            </span>

            {isOwnMessage && (
              <span aria-label="Sent">
                ✓
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;