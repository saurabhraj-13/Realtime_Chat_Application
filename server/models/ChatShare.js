
const mongoose = require("mongoose");

const chatShareSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    ownerUsername: {
      type: String,
      required: true
    },
    chatType: {
      type: String,
      enum: ["global", "private", "group"],
      required: true
    },
    conversationName: {
      type: String,
      default: "Shared conversation"
    },
    messages: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatShare", chatShareSchema);
