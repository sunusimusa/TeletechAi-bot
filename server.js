const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ===== CONFIG =====
const ENERGY_MAX = 100;
const ENERGY_REGEN_TIME = 5000;

// ===== DATABASE =====
const DB_FILE = "./users.json";
let users = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE))
  : {};

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ===== LEVEL SYSTEM =====
function updateLevel(user) {
  const newLevel = Math.floor(user.balance / 100) + 1;
  if (newLevel > user.level) {
    user.level = newLevel;
    user.energy = Math.min(ENERGY_MAX, user.energy + 10);
  }
}

// ===== USER INIT =====
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
    energy: ENERGY_MAX,
    lastEnergyUpdate: Date.now(),
    lastDaily: 0,
    refBy: null,
    referrals: 0,

    // 👇 TASKS NAN
    tasks: {
      youtube: false,
      channel: false,
      group: false
    }
  };
  }

    // referral reward
    if (ref && users[ref] && ref !== userId) {
      users[ref].balance += 20;
      users[ref].referrals += 1;
      users[userId].refBy = ref;
    }

    saveUsers();
  }

  res.json(users[userId]);
});

app.post("/task", (req, res) => {
  const { userId, type } = req.body;
  const user = users[userId];

  if (!user) return res.json({ error: "User not found" });

  if (user.tasks[type]) {
    return res.json({ error: "Task already completed" });
  }

  // reward
  user.tasks[type] = true;
  user.balance += 20;

  saveUsers();

  res.json({
    success: true,
    balance: user.balance
  });
});

// ===== ENERGY REGEN =====
function regenEnergy(user) {
  const now = Date.now();
  const diff = Math.floor((now - user.lastEnergyUpdate) / ENERGY_REGEN_TIME);

  if (diff > 0) {
    user.energy = Math.min(ENERGY_MAX, user.energy + diff);
    user.lastEnergyUpdate = now;
  }
}

// ===== TAP =====
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  const user = users[userId];

  if (!user) return res.json({ error: "User not found" });

  regenEnergy(user);

  if (user.energy <= 0) {
    return res.json({
      error: "No energy",
      balance: user.balance,
      energy: user.energy
    });
  }

  user.energy -= 1;
  user.balance += 1;
  updateLevel(user);

  saveUsers();

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// ===== DAILY =====
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

// ===== LEADERBOARD =====
app.get("/leaderboard", (req, res) => {
  const list = Object.values(users)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  res.json(list);
});

app.post("/convert", (req, res) => {
  const { userId } = req.body;
  const user = users[userId];

  if (!user) return res.json({ error: "User not found" });

  const RATE = 100; // 100 balance = 1 token

  if (user.balance < RATE) {
    return res.json({ error: "Not enough balance" });
  }

  const tokens = Math.floor(user.balance / RATE);

  user.balance -= tokens * RATE;
  user.token += tokens;

  saveUsers();

  res.json({
    token: user.token,
    balance: user.balance
  });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
