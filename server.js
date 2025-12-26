const express = require("express");
const fs = require("fs");
const path = require("path");
const REF_BONUS = 10;
const DAILY_REWARD = 50; // zaka iya canza
const MIN_WITHDRAW = 100; // zaka iya canzawa

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DB = "./users.json";
let users = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : {};

function save() {
  fs.writeFileSync(DB, JSON.stringify(users, null, 2));
}

app.post("/user", (req, res) => {
  const { userId, ref } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      last: Date.now(),
      referredBy: ref || null,
      rewarded: false
    };

    // give referral reward
    if (ref && users[ref] && !users[userId].rewarded) {
      users[ref].balance += REF_BONUS;
      users[userId].rewarded = true;
    }
  }

  const now = Date.now();
  const diff = Math.floor((now - users[userId].last) / 5000);
  if (diff > 0) {
    users[userId].energy = Math.min(100, users[userId].energy + diff);
    users[userId].last = now;
  }

  save();
  res.json(users[userId]);
});

app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({});

  if (users[userId].energy > 0) {
    users[userId].energy--;
    users[userId].balance++;
  }

  save();
  res.json(users[userId]);
});
app.post("/daily", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) return res.json({ error: "User not found" });

  const now = Date.now();
  const lastClaim = users[userId].lastDaily || 0;
  const diff = now - lastClaim;

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.ceil((24*60*60*1000 - diff) / 3600000);
    return res.json({ error: `Come back in ${hours} hours` });
  }

  users[userId].balance += DAILY_REWARD;
  users[userId].lastDaily = now;

  save();
  res.json({
    success: true,
    reward: DAILY_REWARD,
    balance: users[userId].balance
  });
});

app.listen(3000, () => console.log("Running..."));
