
// client/src/components/chat/ChatEmptyState.js

import React from "react";

function ChatEmptyState({
  chatMode,
  selectedUser,
  groupId,
  messages = [],
}) {
  const hasMessages = messages.length > 0;

  if (hasMessages) {
    return null;
  }

  let title = "Welcome to ChatWave!";
  let description = "Start a conversation with your friends.";

  if (chatMode === "private" && selectedUser) {
    title = `Chat with ${selectedUser}`;
    description = "Send a message to start your conversation.";
  } else if (chatMode === "group" && groupId) {
    title = "Welcome to the group!";
    description = "Send the first message to get the conversation started.";
  } else if (chatMode === "global") {
    title = "Welcome to Global Chat!";
    description = "Say hello and start chatting with everyone.";
  }

  return (
    <div className="chat-empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        💬
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

export default ChatEmptyState;