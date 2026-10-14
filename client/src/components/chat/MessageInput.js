
import React from "react";

function MessageInput({
  message,
  onTyping,
  onSend,
  onKeyDown,
  onLocation,
  locationLoading,
  liveLocationActive,
  locationDisabled,
  chatMode,
  selectedUser,
  groupId
}) {
  const getPlaceholder = () => {
    if (chatMode === "private") {
      return `Message ${selectedUser}...`;
    }

    if (chatMode === "group") {
      return `Message group ${groupId}...`;
    }

    return "Type a message...";
  };

  return (
    <>
      <div className="input-box">
        <button
          type="button"
          className="input-action-btn"
          title="Emoji"
        >
          😊
        </button>

        <button
          type="button"
          className="input-action-btn"
          title="Attachment"
        >
          📎
        </button>

        <button
          type="button"
          className="input-action-btn"
          title={liveLocationActive ? "Stop live location" : "Share location"}
          onClick={onLocation}
          disabled={locationDisabled || locationLoading}
        >
          {locationLoading
            ? "⏳"
            : liveLocationActive
            ? "🔴"
            : "📍"}
        </button>

        <textarea
          value={message}
          onChange={onTyping}
          onKeyDown={onKeyDown}
          placeholder={getPlaceholder()}
          rows={1}
        />

        <button
          type="button"
          className="send-btn"
          onClick={onSend}
          title="Send"
        >
          ➤
        </button>
      </div>

      <div className="input-hint">
        Press <b>Enter</b> to send • <b>Shift + Enter</b> for new line
      </div>
    </>
  );
}

export default MessageInput;