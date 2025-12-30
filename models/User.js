const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },

  balance: { type: Number, default: 0 },
  token: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  energy: { type: Number, default: 100 },
  lastEnergyUpdate: { type: Number, default: Date.now },

  lastDaily: { type: Number, default: 0 },
  lastBox: { type: Number, default: 0 },

  // 🎰 Spin
  spinCount: { type: Number, default: 1 },
  lastSpin: { type: Number, default: 0 },

  // 👥 Referral
  refBy: { type: String, default: null },
  referrals: { type: Number, default: 0 },

  // 🎥 Ads / Tasks
  adsSpinCount: { type: Number, default: 0 },
  lastAdsSpin: { type: Number, default: 0 },

  tasks: {
    youtube: { type: Boolean, default: false },
    channel: { type: Boolean, default: false },
    group: { type: Boolean, default: false }
  },

  teamId: { type: String, default: null }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
