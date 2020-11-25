const mongoose = require("mongoose");

// Exercise schema.
let Schema = mongoose.Schema;
let exerciseSchema = new Schema(
  {
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String }
  },
  { versionKey: false }
);

// Exercise model.
let Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = Exercise;