
import React from "react";

function ChatAlerts({
  typingUser,
  locationError,
  onClearLocationError
}) {
  return (
    <>
      {/* TYPING INDICATOR */}
      <div className="typing-area" aria-live="polite">
        {typingUser && (
          <span>{typingUser} is typing...</span>
        )}
      </div>

      {/* LOCATION ERROR */}
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
    </>
  );
}

export default ChatAlerts;