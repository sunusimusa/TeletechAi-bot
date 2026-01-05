import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  from: String,           // sender wallet
  to: String,             // receiver wallet
  amount: Number,
  gasFee: Number,
  type: { type: String, enum: ["SEND", "RECEIVE"] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
