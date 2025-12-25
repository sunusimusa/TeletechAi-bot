import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DB_FILE = "./data.json";

/* helpers */
function readDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* START / CREATE USER */
app.post("/start", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "No userId" });

  const db = readDB();
  if (!db[userId]) {
    db[userId] = {
      balance: 0,
      lastTap: 0,
      wallet: null
    };
    writeDB(db);
  }

  res.json({ ok: true });
});

/* GET BALANCE */
app.get("/balance/:userId", (req, res) => {
  const db = readDB();
  const user = db[req.params.userId];
  res.json({ balance: user ? user.balance : 0 });
});

/* TAP (ANTI-CHEAT: 1 tap/sec) */
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  const now = Date.now();

  const db = readDB();
  const user = db[userId];
  if (!user) return res.status(400).json({ error: "User not found" });

  if (now - user.lastTap < 1000) {
    return res.status(429).json({ error: "Too fast" });
  }

  user.balance += 1;
  user.lastTap = now;
  writeDB(db);

  res.json({ balance: user.balance });
});

/* WITHDRAW (MIN 1000 TT) */
app.post("/withdraw", (req, res) => {
  const { userId, wallet } = req.body;

  const db = readDB();
  const user = db[userId];
  if (!user) return res.status(400).json({ error: "User not found" });

  if (user.balance < 1000) {
    return res.status(400).json({ error: "Minimum withdraw is 1000 TT" });
  }

  if (!wallet || wallet.length < 10) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  user.wallet = wallet;
  user.balance = 0;

  if (!db.withdraws) db.withdraws = [];
  db.withdraws.push({
    userId,
    wallet,
    amount: 1000,
    time: Date.now(),
    status: "pending"
  });

  writeDB(db);
  res.json({ success: true, msg: "Withdraw request sent" });
});

/* START SERVER */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
