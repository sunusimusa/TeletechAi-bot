import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

  /* ===== IDENTITY ===== */
  userId: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  telegramId: {
    type: String,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    default: ""
  },

  /* ===== WALLET ===== */
  walletAddress: {
    type: String,
    unique: true,
    sparse: true
  },

  /* ===== REFERRAL ===== */
  referredBy: { type: String, default: null },
  referrals: { type: [String], default: [] },
  referralsCount: { type: Number, default: 0 },
  joinedByRef: { type: Boolean, default: false },

  /* ===== GAME ===== */
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },
  tokens: { type: Number, default: 0 },
  lastOpenAt: { type: Number, default: 0 },

  /* ===== PRO / ROLE ===== */
  proLevel: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ["user", "founder"],
    default: "user"
  },

  /* ===== ADS ===== */
  adsWatchedToday: { type: Number, default: 0 },
  lastAdDay: { type: String, default: "" },

  /* ===== DAILY ===== */
  dailyStreak: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },

  /* ===== WITHDRAW ===== */
  withdrawals: [
    {
      amount: Number,
      wallet: String,
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  /* ===== META ===== */
  createdFrom: {
    type: String,
    enum: ["web", "playstore", "telegram"],
    default: "web"
  },
  lastLogin: { type: Date, default: Date.now },
  lastSyncAt: { type: Number, default: 0 },

  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Number, default: 0 }

}, { timestamps: true });

export default mongoose.model("User", UserSchema);
