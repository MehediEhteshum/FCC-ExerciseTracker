const mongoose = require("mongoose");

// User schema.
let Schema = mongoose.Schema;
let userSchema = new Schema(
  {
  username: { type: String, required: true }
  },
  { versionKey: false }
);

// User model.
let User = mongoose.model("User", userSchema);

module.exports = User;