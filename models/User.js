import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  telegramId: String,
  balance: { type: Number, default: 0 },
  energy: { type: Number, default: 100 },
  freeTries: { type: Number, default: 3 },
  tokens: { type: Number, default: 0 },
  lastEnergy: { type: Number, default: Date.now }
});

export default mongoose.model("User", UserSchema);
