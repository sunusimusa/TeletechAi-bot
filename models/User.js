import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

  // ===== IDENTITY =====
  telegramId: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  username: {
    type: String,
    default: ""
  },

  // ===== REFERRAL =====
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
  seasonReferrals: {
    type: Number,
    default: 0
  },

  {
  "telegramId": 123456789,
  "username": "sunusi",
  "referralCode": "SUN12345",
  "referredBy": null
},

  // ===== GAME =====
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  lastEnergy: { type: Number, default: () => Date.now() },
  freeTries: { type: Number, default: 3 },
  tokens: { type: Number, default: 0 },

  // ===== WALLET =====
  walletAddress: {
    type: String,
    unique: true,
    sparse: true
  },

  // ===== PRO =====
  isPro: { type: Boolean, default: false },
  proLevel: { type: Number, default: 0 },
  proSince: { type: Number, default: null },

  // ===== ROLE =====
  role: {
    type: String,
    enum: ["user", "founder"],
    default: "user"
  },

  // ===== ADS =====
  adsWatchedToday: { type: Number, default: 0 },
  lastAd: { type: Number, default: 0 },
  lastAdClaim: { type: Number, default: 0 },

  // ===== TRANSFERS =====
  sentTokens: { type: Number, default: 0 },
  receivedTokens: { type: Number, default: 0 },
  sentToday: { type: Number, default: 0 },
  lastSentDay: { type: String, default: "" },
  lastTransferAt: { type: Number, default: 0 },
  lastTransferDay: { type: String, default: "" },

  // ===== DAILY =====
  dailyStreak: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },

  // ===== TASKS =====
  joinedChannel: { type: Boolean, default: false },
  joinedYoutube: { type: Boolean, default: false },
  joinedGroup: { type: Boolean, default: false },
  watchAd: { type: Boolean, default: false },

  // ===== WITHDRAW =====
  withdrawn: { type: Number, default: 0 },
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
  ]

}, { timestamps: true });

export default mongoose.model("User", UserSchema);
