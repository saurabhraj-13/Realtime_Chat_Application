
// client/src/components/chat/ChatFooter.js

import React from "react";

function ChatFooter({
  typingUser,
  locationError,
  onClearLocationError,
  darkMode,
}) {
  return (
    <div
      className={`chat-footer ${darkMode ? "dark-mode" : ""}`}
    >
      {/* Typing Indicator */}
      <div className="typing-area" aria-live="polite">
        {typingUser && (
          <span>{typingUser} is typing...</span>
        )}
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="location-error" role="alert">
          <span>📍 {locationError}</span>

          <button
            type="button"
            onClick={onClearLocationError}
            aria-label="Dismiss location error"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatFooter;