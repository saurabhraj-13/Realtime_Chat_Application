
const mongoose = require("mongoose");

const accountRecoverySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    recoveryCodeHash: {
      type: String,
      required: true,
    },

    failedAttempts: {
      type: Number,
      default: 0,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.AccountRecovery ||
  mongoose.model("AccountRecovery", accountRecoverySchema);
