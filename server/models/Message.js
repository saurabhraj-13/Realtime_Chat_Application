const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // Username of the person who sent the message
    user: {
      type: String,
      required: true,
    },

    // Message content
    message: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    attachments: [
  {
    originalName: {
      type: String,
      trim: true
    },
    storageKey: {
      type: String,
      trim: true
    },
    mimeType: {
      type: String,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    }
  }
],

    // Chat type:
    // global  = everyone
    // private = one-to-one
    // group   = group conversation
    chatType: {
      type: String,
      enum: ["global", "private", "group"],
      default: "global",
    },

    // Used for private chat
    // Example: Saurabh -> Raj
    receiver: {
      type: String,
      default: null,
    },

    // Used for group chat
    // Example: "group_12345"
    groupId: {
      type: String,
      default: null,
    },

    // Message time
    time: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);