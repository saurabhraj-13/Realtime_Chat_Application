const crypto = require("crypto");
const AccountRecovery = require("../models/AccountRecovery");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// =====================================================
// CHECK USERNAME
// =====================================================

router.get(
  "/check-username/:username",
  async (req, res) => {
    try {
      const username =
        req.params.username
          .toLowerCase()
          .trim();

      console.log(
        "🔎 Checking username:",
        username
      );

      const existingUser =
        await User.findOne({
          username
        });

      console.log(
        "🔎 Existing user:",
        existingUser
          ? existingUser.username
          : "NONE"
      );

      if (!existingUser) {
        return res.json({
          available: true,
          suggestions: []
        });
      }

      const suggestions = [
        `${username}01`,
        `${username}123`,
        `${username}${new Date().getFullYear()}`,
        `${username}_official`
      ];

      const availableSuggestions = [];

      for (const suggestion of suggestions) {
        const exists =
          await User.findOne({
            username:
              suggestion.toLowerCase()
          });

        if (!exists) {
          availableSuggestions.push(
            suggestion
          );
        }
      }

      return res.json({
        available: false,
        suggestions:
          availableSuggestions
      });

    } catch (error) {
      console.error(
        "❌ Username check error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to check username"
      });
    }
  }
);


// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",
  async (req, res) => {
    try {
      console.log(
        "📥 Registration request:",
        req.body
      );

      const {
        firstName,
        lastName,
        username,
        password
      } = req.body;

      if (
        !firstName ||
        !lastName ||
        !username ||
        !password
      ) {
        return res.status(400).json({
          message:
            "All fields are required"
        });
      }

      const cleanFirstName =
        firstName.trim();

      const cleanLastName =
        lastName.trim();

      const normalizedUsername =
        username
          .toLowerCase()
          .trim();

      console.log(
        "👤 Registration username:",
        normalizedUsername
      );

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters"
        });
      }

      if (normalizedUsername.length < 3) {
        return res.status(400).json({
          message:
            "Username must be at least 3 characters"
        });
      }


      // =================================================
      // CHECK USERNAME
      // =================================================

      const existingUser =
        await User.findOne({
          username:
            normalizedUsername
        });

      console.log(
        "🔎 Registration username check:",
        existingUser
          ? `FOUND: ${existingUser.username}`
          : "NOT FOUND"
      );

      if (existingUser) {
        return res.status(400).json({
          message:
            "Username already exists"
        });
      }


      // =================================================
      // HASH PASSWORD
      // =================================================

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      // =================================================
      // CREATE USER
      // =================================================

      const user = new User({
        firstName:
          cleanFirstName,

        lastName:
          cleanLastName,

        username:
          normalizedUsername,

        password:
          hashedPassword
      });


      // =================================================
      // SAVE USER
      // =================================================

      await user.save();

      console.log(
        "✅ USER CREATED:",
        normalizedUsername
      );

      return res.status(201).json({
        success: true,
        message:
          "Registration successful"
      });

    } catch (error) {

      console.error(
        "❌ REGISTRATION ERROR:"
      );

      console.error(
        error
      );


      // =================================================
      // DUPLICATE KEY
      // =================================================

      if (error.code === 11000) {

        console.error(
          "❌ DUPLICATE KEY DETAILS:"
        );

        console.error(
          "Key Pattern:",
          error.keyPattern
        );

        console.error(
          "Key Value:",
          error.keyValue
        );


        // Do NOT assume it is username.
        return res.status(400).json({
          message:
            `Duplicate database value: ${
              error.keyValue
                ? JSON.stringify(
                    error.keyValue
                  )
                : "unknown field"
            }`
        });
      }


      // =================================================
      // MONGOOSE VALIDATION ERROR
      // =================================================

      if (
        error.name ===
        "ValidationError"
      ) {

        const messages =
          Object.values(
            error.errors
          ).map(
            (item) =>
              item.message
          );

        return res.status(400).json({
          message:
            messages.join(", ")
        });
      }


      // =================================================
      // OTHER ERROR
      // =================================================

      return res.status(500).json({
        message:
          error.message ||
          "Registration failed"
      });
    }
  }
);


// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",
  async (req, res) => {
    try {

      const {
        username,
        password
      } = req.body;

      if (
        !username ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Username and password are required"
        });
      }

      const normalizedUsername =
        username
          .toLowerCase()
          .trim();

      const user =
        await User.findOne({
          username:
            normalizedUsername
        });

      if (!user) {
        return res.status(401).json({
          message:
            "Invalid username or password"
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          message:
            "Invalid username or password"
        });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message:
            "JWT_SECRET is missing"
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          username:
            user.username
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      return res.json({
        success: true,
        message:
          "Login successful",

        token,

        user: {
          id: user._id,
          firstName:
            user.firstName,
          lastName:
            user.lastName,
          username:
            user.username
        }
      });

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      return res.status(500).json({
        message:
          "Login failed"
      });
    }
  }
);


function getRecoveryAuthUserId(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded && decoded.userId ? String(decoded.userId) : null;
  } catch (error) {
    return null;
  }
}

// Generate a recovery code for the logged-in account.
router.post("/recovery-code", async (req, res) => {
  try {
    const userId = getRecoveryAuthUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Please log in again.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "Account not found. Please log in again.",
      });
    }

    const rawCode = crypto
      .randomBytes(9)
      .toString("hex")
      .toUpperCase();

    const recoveryCode = rawCode.match(/.{1,6}/g).join("-");
    const recoveryCodeHash = await bcrypt.hash(rawCode, 10);

    await AccountRecovery.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          recoveryCodeHash,
          failedAttempts: 0,
          lockedUntil: null,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      success: true,
      recoveryCode,
      message: "Save this code privately. It will not be shown again.",
    });
  } catch (error) {
    console.error("Generate recovery code error:", error);

    return res.status(500).json({
      message: "Could not generate a recovery code.",
    });
  }
});

// Reset a password using an existing username and recovery code.
router.post("/forgot-password/reset-with-code", async (req, res) => {
  try {
    const username = String(req.body.username || "")
      .trim()
      .toLowerCase();

    const recoveryCode = String(req.body.recoveryCode || "")
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase();

    const newPassword = String(req.body.newPassword || "");

    if (
      !/^[a-z0-9_]{3,20}$/.test(username) ||
      !recoveryCode ||
      !newPassword
    ) {
      return res.status(400).json({
        message: "Enter your username, recovery code, and new password.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters.",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "Invalid recovery details or no recovery code is set.",
      });
    }

    const record = await AccountRecovery.findOne({
      userId: user._id,
    });

    if (!record) {
      return res.status(400).json({
        message: "Invalid recovery details or no recovery code is set.",
      });
    }

    const now = new Date();

    if (record.lockedUntil && record.lockedUntil > now) {
      return res.status(429).json({
        message: "Too many attempts. Try again after 15 minutes.",
      });
    }

    if (record.lockedUntil && record.lockedUntil <= now) {
      record.failedAttempts = 0;
      record.lockedUntil = null;
    }

    const validCode = await bcrypt.compare(
      recoveryCode,
      record.recoveryCodeHash
    );

    if (!validCode) {
      record.failedAttempts += 1;

      if (record.failedAttempts >= 5) {
        record.lockedUntil = new Date(
          Date.now() + 15 * 60 * 1000
        );
      }

      await record.save();

      if (record.lockedUntil) {
        return res.status(429).json({
          message: "Too many attempts. Try again after 15 minutes.",
        });
      }

      return res.status(400).json({
        message: "Invalid recovery details. Check your code.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Recovery codes can only be used once.
    await record.deleteOne();

    return res.json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Password reset error:", error);

    return res.status(500).json({
      message: "Could not reset the password. Please try again.",
    });
  }
});

module.exports = router;