const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "./users.json";
let users = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE)) : {};

function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ================= USER INIT =================
app.post("/user", (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.json({ error: "No user id" });

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      lastEnergy: Date.now(),
      lastDaily: 0
    };
  }

  res.json(users[userId]);
});

// ================= TAP =================
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) return res.json({ error: "User not found" });

  if (users[userId].energy <= 0)
    return res.json({ error: "No energy" });

  users[userId].energy -= 1;
  users[userId].balance += 1;

  saveUsers();

  res.json({
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});

// ================= DAILY =================
app.post("/daily", (req, res) => {
  const { userId } = req.body;
  const DAY = 86400000;

  if (!users[userId]) return res.json({ error: "User not found" });

  if (Date.now() - users[userId].lastDaily < DAY)
    return res.json({ error: "Already claimed" });

  users[userId].lastDaily = Date.now();
  users[userId].balance += 20;

  saveUsers();
  res.json({ reward: 20, balance: users[userId].balance });
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on", PORT));
