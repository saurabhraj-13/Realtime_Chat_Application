const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const DeviceTransfer = require("../models/DeviceTransfer");

const router = express.Router();
const normalizeUsername = (value) => typeof value === "string" ? value.trim().toLowerCase() : "";
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    req.auth = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (!req.auth.userId) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired login session" });
  }
};

router.post("/create", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId).select("_id username");
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await DeviceTransfer.create({
      userId: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt
    });

    return res.status(201).json({
      success: true,
      transferToken: rawToken,
      expiresAt
    });
  } catch (error) {
    console.error("Create device transfer error:", error);
    return res.status(500).json({ message: "Unable to create transfer QR" });
  }
});

router.post("/redeem", async (req, res) => {
  try {
    const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ message: "Invalid transfer code" });
    }

    const transfer = await DeviceTransfer.findOneAndUpdate(
      {
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: { $gt: new Date() }
      },
      {
        $set: { usedAt: new Date() }
      },
      { new: true }
    );

    if (!transfer) {
      return res.status(400).json({
        message: "Transfer QR has expired or has already been used. Generate a new one."
      });
    }

    const user = await User.findById(transfer.userId).select("_id firstName lastName username");
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const loginToken = jwt.sign(
      {
        userId: user._id,
        username: normalizeUsername(user.username)
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Device transfer successful",
      token: loginToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Redeem device transfer error:", error);
    return res.status(500).json({ message: "Unable to complete device transfer" });
  }
});

module.exports = router;