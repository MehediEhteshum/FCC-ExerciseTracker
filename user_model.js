const mongoose = require("mongoose");
let Schema = mongoose.Schema;

// Exercise schema.
let exerciseSchema = new Schema(
  {
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String }
  },
  { versionKey: false }
);

// Exercise model.
let Exercise = mongoose.model("Exercise", exerciseSchema);

// User schema.
let userSchema = new Schema(
  {
  username: { type: String, required: true },
  log: [exerciseSchema]
  },
  { versionKey: false }
);

// User model.
let User = mongoose.model("User", userSchema);

module.exports = {
    exercise: Exercise,
    user: User
};