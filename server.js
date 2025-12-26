const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(bodyParser.json());
app.use(express.static("public"));

// ===== DATABASE FILE =====
const DB_FILE = "./data/users.json";

// Load users
let users = {};
if (fs.existsSync(DB_FILE)) {
  users = JSON.parse(fs.readFileSync(DB_FILE));
}

// Save function
function saveUsers() {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// ===============================
// GET USER / CREATE USER
// ===============================
app.post("/tap", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      energy: 100,
      lastEnergyUpdate: Date.now(),
      refs: []
    };
  }

  // idan energy ta ƙare
  if (users[userId].energy <= 0) {
    return res.json({
      balance: users[userId].balance,
      energy: users[userId].energy,
      message: "No energy"
    });
  }

  // ƙara balance
  users[userId].balance += 1;

  // rage energy
  users[userId].energy -= 1;

  saveUsers();

  res.json({
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});
  
  // Energy auto refill (1 energy / 10 sec)
  const now = Date.now();
  const diff = Math.floor((now - users[userId].lastEnergyUpdate) / 10000);

  if (diff > 0) {
    users[userId].energy = Math.min(100, users[userId].energy + diff);
    users[userId].lastEnergyUpdate = now;
  }

  res.json(users[userId]);
});

// ===============================
// TAP FUNCTION
// ===============================
app.post("/tap", (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    return res.json({ error: "User not found" });
  }

  if (users[userId].energy <= 0) {
    return res.json({ error: "No energy" });
  }

  users[userId].energy -= 1;
  users[userId].balance += 1;

  res.json({
    balance: users[userId].balance,
    energy: users[userId].energy
  });
});
app.post("/ref-count", (req, res) => {
  const { userId } = req.body;
  const count = users[userId]?.refs?.length || 0;
  res.json({ count });
});

// ===============================
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
