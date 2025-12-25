import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static("public"));

const USERS_FILE = "./data/users.json";
const WITHDRAWS_FILE = "./data/withdraws.json";

// helpers
function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// INIT USER
app.post("/init", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "No userId" });

  const users = readJSON(USERS_FILE);
  if (!users[userId]) {
    users[userId] = {
      balance: 0,
      lastTap: 0
    };
    writeJSON(USERS_FILE, users);
  }
  res.json({ balance: users[userId].balance });
});

// TAP
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  const now = Date.now();

  const users = readJSON(USERS_FILE);
  if (!users[userId]) return res.status(404).json({ error: "User not found" });

  // anti cheat (1 tap/sec)
  if (now - users[userId].lastTap < 1000) {
    return res.status(429).json({ error: "Too fast" });
  }

  users[userId].balance += 1;
  users[userId].lastTap = now;
  writeJSON(USERS_FILE, users);

  res.json({ balance: users[userId].balance });
});

// BALANCE
app.get("/balance/:userId", (req, res) => {
  const users = readJSON(USERS_FILE);
  res.json({ balance: users[req.params.userId]?.balance || 0 });
});

// WITHDRAW
app.post("/withdraw", (req, res) => {
  const { userId, wallet } = req.body;

  const users = readJSON(USERS_FILE);
  let withdraws = readJSON(WITHDRAWS_FILE);

  if (!users[userId]) return res.status(404).json({ error: "User not found" });
  if (users[userId].balance < 1000)
    return res.status(400).json({ error: "Minimum withdraw is 1000 TT" });

  withdraws.push({
    userId,
    wallet,
    amount: users[userId].balance,
    time: Date.now(),
    status: "pending"
  });

  users[userId].balance = 0;

  writeJSON(USERS_FILE, users);
  writeJSON(WITHDRAWS_FILE, withdraws);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
