const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,

  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },

  lastEnergyUpdate: { type: Number, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
