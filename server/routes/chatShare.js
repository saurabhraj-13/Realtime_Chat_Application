
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const ChatShare = require("../models/ChatShare");

const router = express.Router();

const normalizeUsername = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  try {
    req.auth = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET
    );

    if (!req.auth.userId || !req.auth.username) {
      return res.status(401).json({
        message: "Invalid authentication token"
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired login session"
    });
  }
};

/* CREATE A READ-ONLY CONVERSATION SHARE */
router.post("/create", authenticate, async (req, res) => {
  try {
    const owner = normalizeUsername(req.auth.username);
    const chatType = req.body.chatType;

    let filter;
    let conversationName;

    if (chatType === "global") {
      filter = { chatType: "global" };
      conversationName = "Global Chat";
    } else if (chatType === "private") {
      const otherUser = normalizeUsername(req.body.withUser);

      if (!otherUser || otherUser === owner) {
        return res.status(400).json({
          message: "Select a valid private conversation"
        });
      }

      filter = {
        chatType: "private",
        $or: [
          { user: owner, receiver: otherUser },
          { user: otherUser, receiver: owner }
        ]
      };

      conversationName = `Chat with ${otherUser}`;
    } else if (chatType === "group") {
      return res.status(400).json({
        message:
          "Group sharing is not enabled until group membership checks are configured."
      });
    } else {
      return res.status(400).json({
        message: "Unsupported conversation type"
      });
    }

    const messages = await Message.find(filter)
      .sort({ time: 1, _id: 1 })
      .limit(500)
      .lean();

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await ChatShare.create({
      tokenHash: hashToken(rawToken),
      ownerUsername: owner,
      chatType,
      conversationName,
      messages,
      expiresAt
    });

    return res.status(201).json({
      success: true,
      shareToken: rawToken,
      conversationName,
      messageCount: messages.length,
      expiresAt
    });
  } catch (error) {
    console.error("Create chat share error:", error);
    return res.status(500).json({
      message: "Unable to create conversation share"
    });
  }
});

/* RETRIEVE THE READ-ONLY SHARED COPY */
router.post("/view", async (req, res) => {
  try {
    const token =
      typeof req.body.token === "string"
        ? req.body.token.trim()
        : "";

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "Invalid share QR code"
      });
    }

    const share = await ChatShare.findOne({
      tokenHash: hashToken(token),
      expiresAt: { $gt: new Date() }
    }).lean();

    if (!share) {
      return res.status(404).json({
        message: "This share has expired or is unavailable."
      });
    }

    return res.json({
      success: true,
      conversationName: share.conversationName,
      chatType: share.chatType,
      messages: share.messages,
      expiresAt: share.expiresAt
    });
  } catch (error) {
    console.error("View chat share error:", error);
    return res.status(500).json({
      message: "Unable to open shared conversation"
    });
  }
});

module.exports = router;
