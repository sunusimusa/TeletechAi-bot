import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },

  balance: { type: Number, default: 0 },
  tokens: { type: Number, default: 0 },

  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralsCount: { type: Number, default: 0 }

  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },

  lastEnergy: { type: Number, default: Date.now },
  lastDaily: { type: Number, default: 0 },

  withdrawals: [
    {
      amount: Number,
      wallet: String,
      status: { type: String, default: "pending" },
      date: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.model("User", UserSchema);
