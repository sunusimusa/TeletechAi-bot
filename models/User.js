// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    /* ================= CORE ID ================= */
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    /* ================= BASIC INFO ================= */
    telegramId: {
      type: String,
      default: null,
      unique: true,
      sparse: true
    },

    username: {
      type: String,
      default: ""
    },

    /* ================= ROLE / PRO ================= */
    role: {
      type: String,
      enum: ["user", "founder"],
      default: "user"
    },

    proLevel: {
      type: Number,
      default: 0
    },

    /* ================= WALLET ================= */
    walletAddress: {
      type: String,
      default: null,
      unique: true,
      sparse: true
    },

    /* ================= GAME CORE ================= */
    balance: {
      type: Number,
      default: 0
    },

    energy: {
      type: Number,
      default: 0
    },

    // 🔥 SAU 5 FREE OPEN BOX (ABIN DA KA BUKATA)
    freeTries: {
      type: Number,
      default: 5
    },

    tokens: {
      type: Number,
      default: 0
    },

    /* ================= TIMERS ================= */
    lastEnergyAt: {
      type: Number,
      default: Date.now
    },

    lastOpenAt: {
      type: Number,
      default: 0
    },

    /* ================= REFERRAL ================= */
    referredBy: {
      type: String,
      default: null
    },

    referralsCount: {
      type: Number,
      default: 0
    },

    joinedByRef: {
      type: Boolean,
      default: false
    },

    /* ================= ADS ================= */
    adsWatchedToday: {
      type: Number,
      default: 0
    },

    lastAdDay: {
      type: String,
      default: ""
    },

    /* ================= META ================= */
    createdFrom: {
      type: String,
      enum: ["web", "telegram"],
      default: "web"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", UserSchema);
