// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    /* ================= CORE ================= */
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

    /* ================= OPTIONAL ID ================= */
    // ⚠️ BA UNIQUE – domin kauce wa E11000
    telegramId: {
      type: String,
      default: undefined
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
      default: undefined,
      sparse: true
    },

    /* ================= GAME ================= */
    balance: {
      type: Number,
      default: 0
    },

    energy: {
      type: Number,
      default: 0
    },

    freeTries: {
      type: Number,
      default: 5   // 🎁 FREE BOX ×5
    },

    tokens: {
      type: Number,
      default: 0
    },

    lastEnergyAt: {
      type: Number,
      default: Date.now
    },

    lastOpenAt: {
      type: Number,
      default: 0
    },

    lastConvertAt: {
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

    /* ================= DAILY ================= */
    // SCRATCH
    scratchToday: { type: Number, default: 0 },
    lastScratchDay: { type: String, default: "" },
    scratchUnlocked: { type: Boolean, default: false },
    scratchLeft: { type: Number, default: 3 },
    lastDailyEnergy: { type: String, default: "" },
    
    lastDailyAt: {
      type: Number,
      default: 0
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
