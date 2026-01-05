import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  from: String,           // sender wallet
  to: String,             // receiver wallet
  amount: Number,
  gasFee: Number,
  type: { type: String, enum: ["SEND", "RECEIVE"] },
  createdAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  fromWallet: String,
  toWallet: String,
  amount: Number,
  gasFee: { type: Number, default: 0 },
  type: {
    type: String,
    enum: ["SEND", "RECEIVE", "BURN", "PRO_UPGRADE"],
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
