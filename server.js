import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// ================== FILE PATH ==================
const DATA_FILE = "./data/users.json";

// ================== HELPERS ==================
function readDB() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ================== STATIC FILES ==================
app.use(express.static("public"));

// ================== START / USER ==================
app.post("/user", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "No userId" });

  const db = readDB();

  if (!db[userId]) {
    db[userId] = {
      balance: 0,
      lastTap: 0
    };
    writeDB(db);
  }

  res.json({ balance: db[userId].balance });
});

// ================== TAP ==================
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "No userId" });

  const db = readDB();
  const user = db[userId];
  if (!user) return res.status(400).json({ error: "User not found" });

  const now = Date.now();

  // anti-cheat (1 tap / second)
  if (now - user.lastTap < 1000) {
    return res.status(429).json({ error: "Too fast" });
  }

  user.balance += 1;
  user.lastTap = now;

  writeDB(db);

  res.json({ balance: user.balance });
});

// ================== WITHDRAW ==================
app.post("/withdraw", (req, res) => {
  const { userId, wallet } = req.body;
  const db = readDB();
  const user = db[userId];

  if (!user) return res.status(400).json({ error: "User not found" });
  if (user.balance < 1000)
    return res.status(400).json({ error: "Minimum withdraw is 1000 TT" });

  if (!wallet || wallet.length < 10)
    return res.status(400).json({ error: "Invalid wallet" });

  user.balance = 0;
  writeDB(db);

  res.json({ success: true });
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
