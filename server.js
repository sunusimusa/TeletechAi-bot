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
app.post("/user", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ balance: 0 });
  }

  if (!users[userId]) {
    users[userId] = { balance: 0 };
    saveUsers();
  }

  res.json({ balance: users[userId].balance });
});

// ===============================
// TAP FUNCTION
// ===============================
app.post("/tap", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ balance: 0 });
  }

  if (!users[userId]) {
    users[userId] = { balance: 0 };
  }

  users[userId].balance += 1;
  saveUsers();

  res.json({ balance: users[userId].balance });
});

// ===============================
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
