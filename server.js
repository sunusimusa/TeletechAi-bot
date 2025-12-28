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
      lastDaily: 0,
      refs: []
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
  const user = users[userId];

  if (!user) return res.json({ error: "User not found" });

  const now = Date.now();

  if (now - user.lastTap < 300) {
    return res.json({ error: "Slow down" });
  }

  if (user.energy <= 0) {
    return res.json({ error: "No energy" });
  }

  user.lastTap = now;
  user.energy -= 1;
  user.balance += 1;

  res.json({
    balance: user.balance,
    energy: user.energy
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
