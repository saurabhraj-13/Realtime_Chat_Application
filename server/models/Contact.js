
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    ownerUsername: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },

    contactUsername: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// A user cannot add the same contact more than once.
contactSchema.index(
  { ownerUsername: 1, contactUsername: 1 },
  { unique: true }
);

module.exports = mongoose.model("Contact", contactSchema);
