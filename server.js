const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= DATABASE =================
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/luckybox")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ Mongo error:", err));

// ================= USER MODEL =================
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },

  balance: {
    type: Number,
    default: 0
  },

  energy: {
    type: Number,
    default: 100
  },

  lastEnergyUpdate: {
    type: Number,
    default: Date.now
  }
});
// ================= ENERGY SYSTEM =================
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / 10000); // 10s

  if (diff > 0) {
    user.energy = Math.min(100, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

// ================= OPEN BOX =================
app.post("/api/open-box", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.json({ error: "NO_USER" });

  let user = await User.findOne({ userId });
  if (!user) user = await User.create({ userId });

  regenEnergy(user);

  if (user.energy < 10) {
    return res.json({ error: "NO_ENERGY" });
  }

  user.energy -= 10;

  const rewards = [
    { type: "coins", value: 100 },
    { type: "coins", value: 300 },
    { type: "token", value: 1 },
    { type: "nothing", value: 0 }
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  if (reward.type === "coins") user.balance += reward.value;

  await user.save();

  res.json({
    reward: reward.type === "nothing" ? "Nothing 😢" : `${reward.value} ${reward.type}`,
    energy: user.energy,
    balance: user.balance
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
