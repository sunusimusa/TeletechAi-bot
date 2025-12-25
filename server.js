import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

// START / CREATE USER
app.post("/start", (req, res) => {
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

  res.json(users[userId]);
});

// TAP
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "No userId" });

  const users = readJSON(USERS_FILE);
  const now = Date.now();

  if (!users[userId]) {
    users[userId] = { balance: 0, lastTap: 0 };
  }

  // anti cheat: 1 tap / second
  if (now - users[userId].lastTap < 1000) {
    return res.status(429).json({ balance: users[userId].balance });
  }

  users[userId].balance += 1;
  users[userId].lastTap = now;

  writeJSON(USERS_FILE, users);
  res.json({ balance: users[userId].balance });
});

// WITHDRAW (DEMO)
app.post("/withdraw", (req, res) => {
  const { userId, wallet } = req.body;
  const users = readJSON(USERS_FILE);
  const withdraws = fs.existsSync(WITHDRAWS_FILE)
    ? JSON.parse(fs.readFileSync(WITHDRAWS_FILE))
    : [];

  if (!users[userId]) {
    return res.status(400).json({ error: "User not found" });
  }

  if (users[userId].balance < 1000) {
    return res.status(400).json({ error: "Minimum withdraw is 1000 TT" });
  }

  withdraws.push({
    userId,
    wallet,
    amount: users[userId].balance,
    status: "pending",
    time: Date.now()
  });

  users[userId].balance = 0;

  writeJSON(USERS_FILE, users);
  fs.writeFileSync(WITHDRAWS_FILE, JSON.stringify(withdraws, null, 2));

  res.json({ msg: "Withdraw request sent (demo)" });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
