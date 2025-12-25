import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 5000;
const DATA_FILE = "./data/users.json";
const WITHDRAW_FILE = "./data/withdraws.json";

// ensure files exist
if (!fs.existsSync("./data")) fs.mkdirSync("./data");
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}");
if (!fs.existsSync(WITHDRAW_FILE)) fs.writeFileSync(WITHDRAW_FILE, "[]");

const readUsers = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeUsers = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));

const readWithdraws = () => JSON.parse(fs.readFileSync(WITHDRAW_FILE));
const writeWithdraws = (d) => fs.writeFileSync(WITHDRAW_FILE, JSON.stringify(d, null, 2));

/* CREATE / GET USER */
app.post("/user", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "No userId" });

  const users = readUsers();
  if (!users[userId]) {
    users[userId] = { balance: 0, lastTap: 0 };
    writeUsers(users);
  }

  res.json({ balance: users[userId].balance });
});

/* TAP */
app.post("/tap", (req, res) => {
  const { userId } = req.body;
  const users = readUsers();

  if (!users[userId]) return res.status(400).json({ error: "User not found" });

  const now = Date.now();
  if (now - users[userId].lastTap < 1000) {
    return res.status(429).json({ error: "Too fast" });
  }

  users[userId].balance += 1;
  users[userId].lastTap = now;

  writeUsers(users);
  res.json({ balance: users[userId].balance });
});

/* WITHDRAW (MIN 1000) */
app.post("/withdraw", (req, res) => {
  const { userId, wallet } = req.body;
  const users = readUsers();
  const withdraws = readWithdraws();

  if (!users[userId]) return res.status(400).json({ error: "User not found" });
  if (users[userId].balance < 1000)
    return res.status(400).json({ error: "Minimum withdraw is 1000 TT" });
  if (!wallet || wallet.length < 10)
    return res.status(400).json({ error: "Invalid wallet" });

  withdraws.push({
    userId,
    wallet,
    amount: users[userId].balance,
    status: "pending",
    time: Date.now(),
  });

  users[userId].balance = 0;

  writeUsers(users);
  writeWithdraws(withdraws);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
