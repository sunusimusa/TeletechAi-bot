import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    /* ================= IDENTITY ================= */
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // OPTIONAL – Telegram (safe, ba zai yi duplicate error ba)
    telegramId: {
      type: String,
      unique: true,
      sparse: true // ✅ MUHIMMI
    },

    username: {
      type: String,
      default: ""
    },

    sessionId: {
      type: String,
      unique: true,
      sparse: true // session ba dole ba
    },

    /* ================= WALLET ================= */
    walletAddress: {
      type: String,
      unique: true,
      sparse: true
    },

    /* ================= REFERRAL ================= */
    referredBy: {
      type: String,
      default: null
    },

    referrals: {
      type: [String],
      default: []
    },

    referralsCount: {
      type: Number,
      default: 0
    },

    joinedByRef: {
      type: Boolean,
      default: false
    },

    /* ================= GAME ================= */
    balance: {
      type: Number,
      default: 0
    },

    tokens: {
      type: Number,
      default: 0
    },

    energy: {
      type: Number,
      default: 100
    },

    freeTries: {
      type: Number,
      default: 3
    },

    lastOpenAt: {
      type: Number,
      default: 0
    },

    lastConvertAt: {
      type: Number,
      default: 0
    },

    /* ================= ROLE / PRO ================= */
    role: {
      type: String,
      enum: ["user", "founder"],
      default: "user"
    },

    proLevel: {
      type: Number,
      default: 0 // 0–3 user, 4 founder
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

    lastAdAt: {
      type: Number,
      default: 0
    },

    /* ================= DAILY ================= */
    dailyStreak: {
      type: Number,
      default: 0
    },

    lastDaily: {
      type: String,
      default: ""
    },

    /* ================= META ================= */
    createdFrom: {
      type: String,
      enum: ["web", "playstore", "telegram"],
      default: "web"
    },

    lastLogin: {
      type: Date,
      default: Date.now
    },

    lastSyncAt: {
      type: Number,
      default: 0
    },

    isOnline: {
      type: Boolean,
      default: false
    },

    lastSeen: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
