const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },

  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  level: { type: Number, default: 1 },

  lastEnergyUpdate: { type: Number, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
