
// client/src/components/chat/ChatMessageMeta.js

import React from "react";

function ChatMessageMeta({
  time,
  formatTime,
  isOwnMessage,
  status,
}) {
  const formattedTime = formatTime
    ? formatTime(time)
    : "";

  return (
    <div className="message-meta">
      <span>{formattedTime}</span>

      {isOwnMessage && (
        <span
          className="message-status"
          aria-label={status || "Sent"}
          title={status || "Sent"}
        >
          {status === "read"
            ? "✓✓"
            : status === "delivered"
            ? "✓✓"
            : "✓"}
        </span>
      )}
    </div>
  );
}

export default ChatMessageMeta;