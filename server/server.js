const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/luckybox");

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 }
});

function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / 10000); // 10 sec

  if (diff > 0) {
    user.energy = Math.min(100, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

// 🎁 OPEN BOX
app.post("/api/open-box", async (req, res) => {
  const { userId } = req.body;

  let user = await User.findOne({ userId });
  if (!user) user = await User.create({ userId });

  const rewards = [
    { type: "coins", value: 100 },
    { type: "coins", value: 500 },
    { type: "token", value: 1 },
    { type: "nothing", value: 0 },
    { type: "coins", value: 1000 }
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  if (reward.type === "coins") {
    user.balance += reward.value;
  }

  await user.save();

  res.json({
    reward: reward.type === "nothing"
      ? "Nothing 😢"
      : `${reward.value} ${reward.type.toUpperCase()}`
  });
});

app.listen(3000, () => console.log("🚀 Server running"));
