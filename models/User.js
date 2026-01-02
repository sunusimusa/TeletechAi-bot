import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },

  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },
  tokens: { type: Number, default: 0 },

  referralCode: { type: String },
  referredBy: { type: String, default: null },
  referralsCount: { type: Number, default: 0 },

  dailyStreak: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },
  
joinedChannel: { type: Boolean, default: false },
  joinedYoutube: { type: Boolean, default: false },
  joinedGroup: { type: Boolean, default: false }
});

export default mongoose.model("User", UserSchema);
