
// client/src/components/chat/ChatHelpers.js

// Get the first letter of a username for the avatar
export const getAvatar = (name) => {
  if (!name || typeof name !== "string") {
    return "U";
  }

  return name.trim().charAt(0).toUpperCase() || "U";
};

// Format message time
export const formatTime = (time) => {
  if (!time) {
    return "";
  }

  const date = new Date(time);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Extract location data from a message
export const getLocationData = (message) => {
  if (!message) {
    return null;
  }

  try {
    let data = message;

    // Parse JSON when the message contains a JSON string
    if (typeof message === "string") {
      data = JSON.parse(message);
    } else if (typeof message.message === "string") {
      data = JSON.parse(message.message);
    } else if (message.message && typeof message.message === "object") {
      data = message.message;
    }

    if (!data || typeof data !== "object") {
      return null;
    }

    const latitude = Number(data.latitude ?? data.lat);
    const longitude = Number(data.longitude ?? data.lng ?? data.lon);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return null;
    }

    return {
      type: "location",
      latitude,
      longitude,
    };
  } catch (error) {
    return null;
  }
};

// Get the title for the active chat
export const getChatTitle = ({
  chatMode,
  selectedUser,
  groupId,
  username,
}) => {
  if (chatMode === "private") {
    return selectedUser || "Private Chat";
  }

  if (chatMode === "group") {
    return groupId || "Group Chat";
  }

  return username ? "Global Chat" : "ChatWave";
};