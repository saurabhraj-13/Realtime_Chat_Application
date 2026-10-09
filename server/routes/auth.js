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


module.exports = router;