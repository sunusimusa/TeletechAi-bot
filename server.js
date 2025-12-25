const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const USERS_FILE = "./data/users.json";
const WITHDRAW_FILE = "./data/withdraws.json";

// helper
function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get user
app.post("/user", (req, res) => {
  const { userId } = req.body;
  let users = readJSON(USERS_FILE);

  if (!users[userId]) {
    users[userId] = { balance: 0 };
    writeJSON(USERS_FILE, users);
  }

  res.json({ balance: users[userId].balance });
});

// Tap
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  let users = readJSON(USERS_FILE);

  if (!users[userId]) users[userId] = { balance: 0 };

  users[userId].balance += 1;
  writeJSON(USERS_FILE, users);

  res.json({ balance: users[userId].balance });
});

// Withdraw
app.post("/withdraw", (req, res) => {
  const { userId } = req.body;
  let users = readJSON(USERS_FILE);
  let withdraws = readJSON(WITHDRAW_FILE);

  if (!users[userId] || users[userId].balance < 1000) {
    return res.json({ error: "Minimum 1000 TT required" });
  }

  withdraws[userId] = {
    amount: users[userId].balance,
    time: Date.now()
  };

  users[userId].balance = 0;

  writeJSON(USERS_FILE, users);
  writeJSON(WITHDRAW_FILE, withdraws);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
