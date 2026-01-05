import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
  fromWallet: {
    type: String,
    required: true
  },

  toWallet: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  gasFee: {
    type: Number,
    default: 0
  },

  type: {
    type: String,
    enum: ["SEND", "RECEIVE", "BURN", "PRO_UPGRADE"],
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Transaction", TransactionSchema);
