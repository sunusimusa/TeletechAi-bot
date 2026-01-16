// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    /* ===== CORE ID ===== */
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    telegramId: {
      type: String,
      default: null,
      unique: true,
      sparse: true // ✅ yana hana duplicate null
    },

    username: {
      type: String,
      default: ""
    },

    /* ===== ROLE / PRO ===== */
    role: {
      type: String,
      enum: ["user", "founder"],
      default: "user"
    },
    proLevel: { type: Number, default: 0 },

    /* ===== WALLET ===== */
    walletAddress: {
      type: String,
      default: null,
      unique: true,
      sparse: true
    },

    /* ===== GAME ===== */
    balance: { type: Number, default: 0 },
    energy: { type: Number, default: 100 },
    freeTries: { type: Number, default: 3 },
    tokens: { type: Number, default: 0 },

    lastEnergyAt: { type: Number, default: Date.now },
    lastOpenAt: { type: Number, default: 0 },
    lastConvertAt: { type: Number, default: 0 },

    /* ===== REFERRAL ===== */
    referredBy: { type: String, default: null },
    referralsCount: { type: Number, default: 0 },
    joinedByRef: { type: Boolean, default: false },

    /* ===== ADS / DAILY ===== */
    adsWatchedToday: { type: Number, default: 0 },
    lastAdDay: { type: String, default: "" },
    lastDaily: { type: String, default: "" },

    /* ===== META ===== */
    createdFrom: {
      type: String,
      enum: ["web", "telegram"],
      default: "web"
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
