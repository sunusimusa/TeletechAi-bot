import mongoose from "mongoose";

const MarketSchema = new mongoose.Schema({
  reservePoints: { type: Number, default: 0 }, // coins
  reserveJetton: { type: Number, default: 0 }, // tokens
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Market", MarketSchema);
