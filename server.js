const express = require("express");
const fs = require("fs");
const path = require("path");
const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 10000; // 10 seconds

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ================= DATABASE =================
const DB_FILE = "./users.json";
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= USER INIT =================
app.post("/user", (req, res) => {
  const { initData } = req.body;

  const userId = initData?.user?.id;
  const ref = initData?.start_param;

  if (!userId) return res.json({ error: "Invalid user" });

  if (!users[userId]) {
    users[userId] = {
      id: userId,
      balance: 0,
      level: 1,
      energy: 100,
      lastTap: 0,
      lastEnergyUpdate: Date.now()
      lastDaily: 0,
      refBy: null,
      referrals: 0
    };

    // 🎁 Referral bonus
    if (ref && users[ref] && ref !== userId) {
      users[userId].refBy = ref;
      users[ref].balance += 20;
      users[ref].referrals += 1;
    }

    saveUsers();
  }

  res.json(users[userId]);
});

// ================= TAP =================
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  const user = users[userId];

  if (!user) return res.json({ error: "User not found" });

  const now = Date.now();

  // 🔋 ENERGY REGEN (1 energy / 5 sec)
  const regenTime = 5000;
  const diff = Math.floor((now - user.lastEnergy) / regenTime);
  if (diff > 0) {
    user.energy = Math.min(100, user.energy + diff);
    user.lastEnergy = now;
  }

  if (user.energy <= 0) {
    return res.json({
      error: "No energy",
      balance: user.balance,
      energy: user.energy
    });
  }

  user.energy -= 1;
  user.balance += 1;

  saveUsers();

  res.json({
    balance: user.balance,
    energy: user.energy
  });
});

// ================= DAILY =================
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  const user = users[userId];

  if (!user) return res.json({ error: "User not found" });

  const now = Date.now();
  if (now - user.lastDaily < 86400000) {
    return res.json({ error: "Come back tomorrow" });
  }

  user.lastDaily = now;
  user.balance += 50;

  saveUsers();
  res.json({ balance: user.balance });
});

// ================= LEADERBOARD =================
app.get("/leaderboard", (req, res) => {
  const list = Object.values(users)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  res.json(list);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
