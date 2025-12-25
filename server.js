import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const __dirname = path.resolve();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const USERS_FILE = "./data/users.json";
const WITHDRAWS_FILE = "./data/withdraws.json";

// ===== HELPERS =====
function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===== USER INIT =====
app.post("/user", (req, res) => {
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

// ===== TAP =====
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "No userId" });

  const users = readJSON(USERS_FILE);
  const user = users[userId];

  if (!user) return res.status(404).json({ error: "User not found" });

  const now = Date.now();

  // Anti-cheat: 1 tap / second
  if (now - user.lastTap < 1000) {
    return res.status(429).json({ error: "Too fast" });
  }

  user.balance += 1;
  user.lastTap = now;

  writeJSON(USERS_FILE, users);

  res.json({ balance: user.balance });
});

// ===== WITHDRAW =====
app.post("/withdraw", (req, res) => {
  const { userId, wallet } = req.body;

  if (!userId || !wallet) {
    return res.status(400).json({ error: "Missing data" });
  }

  const users = readJSON(USERS_FILE);
  const withdraws = readJSON(WITHDRAWS_FILE);

  if (!users[userId]) {
    return res.status(404).json({ error: "User not found" });
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
  writeJSON(WITHDRAWS_FILE, withdraws);

  res.json({ success: true });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
