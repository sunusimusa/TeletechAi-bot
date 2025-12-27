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
  if (!users[userId]) return res.json({ error: "User not found" });

  if (users[userId].energy <= 0)
    return res.json({ error: "No energy" });

  users[userId].energy--;
  users[userId].balance++;

  save();
  res.json(users[userId]);
});

// DAILY
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  const now = Date.now();

  if (now - users[userId].lastDaily < 86400000)
    return res.json({ error: "Come tomorrow" });

  users[userId].lastDaily = now;
  users[userId].balance += 50;

  save();
  res.json(users[userId]);
});

// LEADERBOARD
app.get("/leaderboard", (req, res) => {
  const list = Object.entries(users)
    .map(([id, u]) => ({ id, balance: u.balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10);

  res.json(list);
});

app.listen(PORT, () => console.log("Server running on", PORT));
