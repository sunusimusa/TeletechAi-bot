import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },

  // ===== GAME =====
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  lastEnergy: { type: Number, default: Date.now },
  freeTries: { type: Number, default: 3 },
  tokens: { type: Number, default: 0 },

  // ===== REFERRAL =====
  referralCode: { type: String },
  referredBy: { type: String, default: null },
  referralsCount: { type: Number, default: 0 },
  isPro: { type: Boolean, default: false },
proSince: { type: Number, default: null },
  proLevel: { type: Number, default: 0 }, // 0=FREE, 1=PRO, 2=PRO+, 3=PRO MAX
  proLevel: { type: Number, default: 0 }, // 0 = free
proSince: { type: Number, default: 0 },

  // ===== DAILY =====
  dailyStreak: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },
  lastAd: { type: Number, default: 0 },
  lastAdClaim: { type: Number, default: 0 }

  // ===== TASKS =====
  joinedChannel: { type: Boolean, default: false },
  joinedYoutube: { type: Boolean, default: false },
  joinedGroup: { type: Boolean, default: false },

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
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, { timestamps: true });

export default mongoose.model("User", UserSchema);
