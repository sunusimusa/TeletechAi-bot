const WithdrawSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  wallet: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "sent"],
    default: "pending"
  },
  txHash: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Withdraw", WithdrawSchema);
