const express = require("express");
const fs = require("fs");
const REF_REWARD = 10;

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const DB = "./users.json";

let users = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : {};

function save() {
  fs.writeFileSync(DB, JSON.stringify(users, null, 2));
}

function checkLevel(user) {
  if (user.balance >= 1000) user.level = 5;
  else if (user.balance >= 600) user.level = 4;
  else if (user.balance >= 300) user.level = 3;
  else if (user.balance >= 100) user.level = 2;
  else user.level = 1;
}

// CREATE / LOAD USER
app.post("/user", (req, res) => {
  const initData = req.body.initData;
  if (!initData || !initData.user) return res.json({ error: "No user" });

  const user = initData.user;
  const userId = user.id.toString();
  const ref = initData.start_param; // referral code

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      level: 1,
      lastTap: 0
    };

    // REFERRAL REWARD
    if (ref && users[ref] && ref !== userId) {
      if (!users[ref].refs.includes(userId)) {
        users[ref].refs.push(userId);
        users[ref].balance += REF_REWARD;
      }
    }
  }

  res.json({
    id: userId,
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});

// TAP
app.post("/tap", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      level: 1,
      lastTap: 0
    };
  }

  const user = users[userId];

  // Anti-spam
const now = Date.now();

// idan bai taba tap ba
if (!user.lastTap) user.lastTap = 0;

// delay kadan (300ms)
if (now - user.lastTap < 300) {
  return res.json({
    error: "Slow down ⚡",
    balance: user.balance,
    energy: user.energy
  });
}

// idan energy ya kare
if (user.energy <= 0) {
  return res.json({
    error: "No energy 😴",
    balance: user.balance,
    energy: user.energy
  });
}

// update
user.lastTap = now;
user.energy -= 1;
user.balance += 1;
  
  // Level system
  if (user.balance >= 1000) user.level = 5;
  else if (user.balance >= 600) user.level = 4;
  else if (user.balance >= 300) user.level = 3;
  else if (user.balance >= 100) user.level = 2;
  else user.level = 1;

  res.json({
    balance: user.balance,
    energy: user.energy,
    level: user.level
  });
});

// DAILY
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

// ================= TOKEN CONVERT =================
app.post("/convert", (req, res) => {
  const { userId } = req.body;

  const user = users[userId];
  if (!user) return res.json({ error: "User not found" });

  const rate = 100; // 100 balance = 1 token

  if (user.balance < rate)
    return res.json({ error: "Not enough balance" });

  const tokens = Math.floor(user.balance / rate);

  user.balance -= tokens * rate;
  user.token = (user.token || 0) + tokens;

  saveUsers();

  res.json({
    token: user.token,
    balance: user.balance
  });
});

// LEADERBOARD
app.get("/leaderboard", (req, res) => {
  const list = Obj
    ect.entries(users)
    .map(([id, u]) => ({ id, balance: u.balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  res.json(list);
});

app.listen(PORT, () => console.log("Server running on", PORT));
