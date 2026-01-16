// server.js (snippet)
import session from "express-session";
import crypto from "crypto";
import User from "./models/User.js";

app.use(session({
  name: "teletech.sid",
  secret: process.env.SESSION_SECRET || "teletech-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  }
}));

/* ================= AUTO ENERGY ================= */
function getMaxEnergy(user) {
  if (user.proLevel >= 4) return 999;
  if (user.proLevel >= 3) return 300;
  if (user.proLevel >= 2) return 200;
  if (user.proLevel >= 1) return 150;
  return 100;
}

function regenEnergy(user) {
  const now = Date.now();
  const last = user.lastEnergyAt || now;

  const INTERVAL = 5 * 60 * 1000; // 5 minutes
  const gained = Math.floor((now - last) / INTERVAL);
  if (gained <= 0) return;

  const max = getMaxEnergy(user);
  user.energy = Math.min(user.energy + gained, max);
  user.lastEnergyAt = last + gained * INTERVAL;
}

/* ================= FINAL /api/user ================= */
app.post("/api/user", async (req, res) => {
  try {
    let user;

    // 🔐 1. idan akwai session → samo user
    if (req.session.userId) {
      user = await User.findOne({ userId: req.session.userId });
    }

    // 🆕 2. idan babu session ko user → ƙirƙiri sabo
    if (!user) {
      const userId = "USER_" + crypto.randomUUID();

      user = await User.create({
        userId,
        wallet: "TTECH-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
        energy: 100,
        freeTries: 3
      });

      req.session.userId = user.userId;
    }

    // ⚡ 3. auto energy
    regenEnergy(user);
    await user.save();

    // 📦 4. response (SOURCE OF TRUTH)
    res.json({
      success: true,
      userId: user.userId,
      wallet: user.wallet,
      balance: user.balance,
      tokens: user.tokens,
      energy: user.energy,
      freeTries: user.freeTries,
      proLevel: user.proLevel,
      role: user.role,
      maxEnergy: getMaxEnergy(user)
    });

  } catch (err) {
    console.error("API /user ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});
