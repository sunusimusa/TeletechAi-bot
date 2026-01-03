import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/User.js";
import Market from "./models/Market.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// ================= UTILS =================
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function regenEnergy(user) {
  const now = Date.now();

  const ENERGY_TIME = 5 * 60 * 1000; // 5 minutes
  const ENERGY_GAIN = 5;
  const MAX_ENERGY = 100;

  const diff = Math.floor((now - user.lastEnergy) / ENERGY_TIME);

  if (diff > 0) {
    user.energy = Math.min(
      MAX_ENERGY,
      user.energy + diff * ENERGY_GAIN
    );

    user.lastEnergy = now;
  }
}

// ================= USER =================
app.post("/api/user", async (req, res) => {
  const { telegramId, ref } = req.body;

  if (!telegramId) {
    return res.json({ error: "NO_TELEGRAM_ID" });
  }

  let user = await User.findOne({ telegramId });

  // CREATE USER
  if (!user) {
    user = await User.create({
      telegramId,
      referralCode: generateCode(),
      referredBy: ref || null
    });

    // REWARD REFERRER
    if (ref) {
      const refUser = await User.findOne({ referralCode: ref });
      if (refUser) {
        refUser.balance += 500;
        refUser.energy = Math.min(100, refUser.energy + 20);
        refUser.referralsCount += 1;
        await refUser.save();
      }
    }
  }

  // ⚠️ SAFETY: idan tsohon user bashi da code
  if (!user.referralCode) {
    user.referralCode = generateCode();
    await user.save();
  }

  res.json({
    telegramId: user.telegramId,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries,
    tokens: user.tokens,
    referralCode: user.referralCode,
    referralsCount: user.referralsCount
  });
});

// ================= DAILY BONUS =================
app.post("/api/daily", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  // 🔧 FIX: tabbatar lastEnergy yana nan
  if (!user.lastEnergy) {
    user.lastEnergy = Date.now();
  }

  // 🔋 REGEN ENERGY FARKO
  regenEnergy(user);

  const now = Date.now();
  const DAY = 86400000;

  if (now - user.lastDaily < DAY) {
    return res.json({ error: "COME_BACK_LATER" });
  }

  // 🔥 DAILY STREAK
  if (now - user.lastDaily < DAY * 2) {
    user.dailyStreak += 1;
  } else {
    user.dailyStreak = 1;
  }

  const reward = 100 * user.dailyStreak;

  user.lastDaily = now;
  user.balance += reward;
  user.energy = Math.min(100, user.energy + 10); // ⬅️ kada ya wuce 100

  await user.save();

  res.json({
    reward,
    streak: user.dailyStreak,
    balance: user.balance,
    energy: user.energy,
    tokens: user.tokens,
    freeTries: user.freeTries,
    referralCode: user.referralCode,
    referralsCount: user.referralsCount
  });
});

// ================= OPEN BOX =================
app.post("/api/open", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  regenEnergy(user);

  if (user.freeTries > 0) user.freeTries--;
  else if (user.energy >= 10) user.energy -= 10;
  else return res.json({ error: "NO_ENERGY" });

  const reward = [0, 100, 200][Math.floor(Math.random() * 3)];
  user.balance += reward;

  await user.save();

  res.json({
    reward,
    balance: user.balance,
    energy: user.energy,
    freeTries: user.freeTries
  });
});

// ================= CONVERT =================
app.post("/api/convert", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { telegramId } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: "TELEGRAM_ID_REQUIRED" });
    }

    session.startTransaction();

    const user = await User.findOne({ telegramId }).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    if (user.balance < 10000) {
      await session.abortTransaction();
      return res.status(400).json({ error: "NOT_ENOUGH_POINTS" });
    }

    user.balance -= 10000;
    user.tokens = (user.tokens || 0) + 1;

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      tokens: user.tokens,
      balance: user.balance
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Atomic convert error:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/withdraw", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { telegramId, wallet, amount } = req.body;

    if (!telegramId || !wallet || !amount) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    session.startTransaction();

    const user = await User.findOne({ telegramId }).session(session);

    if (!user || user.tokens < amount) {
      await session.abortTransaction();
      return res.status(400).json({ error: "NOT_ENOUGH_TOKENS" });
    }

    user.tokens -= amount;
    await user.save({ session });

    await Withdraw.create([{
      telegramId,
      wallet,
      amount
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, status: "pending" });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Withdraw error:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ================= BUY ENERGY =================
app.post("/api/buy-energy", async (req, res) => {
  const { telegramId, amount } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  let cost = 0;

  if (amount === 100) cost = 500;
  else if (amount === 500) cost = 2000;
  else return res.json({ error: "INVALID_AMOUNT" });

  if (user.balance < cost)
    return res.json({ error: "NOT_ENOUGH_COINS" });

  user.balance -= cost;
  user.energy += amount;

  await user.save();

  res.json({
    energy: user.energy,
    balance: user.balance
  });
});

app.post("/api/task/youtube", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.joinedYoutube) return res.json({ error: "ALREADY_DONE" });

  user.joinedYoutube = true;
  user.tokens += 10;

  await user.save();

  res.json({
    success: true,
    tokens: user.tokens
  });
});

app.post("/api/task/group", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.joinedGroup) return res.json({ error: "ALREADY_DONE" });

  user.joinedGroup = true;
  user.tokens += 5;

  await user.save();

  res.json({
    success: true,
    tokens: user.tokens
  });
});

app.post("/api/task/channel", async (req, res) => {
  const { telegramId } = req.body;
  const user = await User.findOne({ telegramId });

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.joinedChannel) return res.json({ error: "ALREADY_DONE" });

  user.joinedChannel = true;
  user.tokens += 5;

  await user.save();

  res.json({
    success: true,
    tokens: user.tokens
  });
});

// ================= MARKET BUY TOKEN =================
app.post("/api/market/buy", async (req, res) => {
  const { telegramId, amount } = req.body; // amount = token count

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  const price = amount * 10000; // 1 token = 10k coins

  if (user.balance < price)
    return res.json({ error: "NOT_ENOUGH_COINS" });

  user.balance -= price;
  user.tokens += amount;

  await user.save();

  res.json({
    balance: user.balance,
    tokens: user.tokens
  });
});

// ================= MARKET SELL TOKEN =================
app.post("/api/market/sell", async (req, res) => {
  const { telegramId, amount } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.json({ error: "USER_NOT_FOUND" });

  if (user.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  const coins = amount * 10000;

  user.tokens -= amount;
  user.balance += coins;

  await user.save();

  res.json({
    balance: user.balance,
    tokens: user.tokens
  });
});

import TonWeb from "tonweb";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(process.env.RPC_URL)
);

const keyPair = TonWeb.utils.keyPairFromSeed(
  Buffer.from(process.env.PRIVATE_KEY, "hex")
);

const wallet = tonweb.wallet.create({
  publicKey: keyPair.publicKey,
  wc: 0
});

app.post("/api/withdraw", async (req, res) => {
  try {
    const { telegramId, address, amount } = req.body;

    const user = await User.findOne({ telegramId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    if (amount <= 0)
      return res.json({ error: "INVALID_AMOUNT" });

    if (user.tokens < amount)
      return res.json({ error: "NOT_ENOUGH_TOKENS" });

    // TOKEN → TON example (1 token = 0.1 TON)
    const TON_AMOUNT = amount * 0.1;

    const seqno = await wallet.methods.seqno().call();

    await wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: address,
      amount: TonWeb.utils.toNano(TON_AMOUNT),
      seqno,
      sendMode: 3
    }).send();

    // update user
    user.tokens -= amount;
    user.withdrawn += amount;
    await user.save();

    res.json({
      success: true,
      message: "Withdraw sent to blockchain"
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "BLOCKCHAIN_ERROR" });
  }
});

import nacl from "tweetnacl";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(process.env.RPC_URL)
);

const seed = Buffer.from(process.env.PRIVATE_KEY, "hex");
const keyPair = nacl.sign.keyPair.fromSeed(seed);

const wallet = tonweb.wallet.create({
  publicKey: keyPair.publicKey,
  wc: 0
});

const jettonMinter = new tonweb.token.jetton.JettonMinter(
  tonweb.provider,
  { address: process.env.JETTON_MASTER }
);

app.post("/api/withdraw/jetton", async (req, res) => {
  try {
    const { telegramId, address, amount } = req.body;

    const user = await User.findOne({ telegramId });
    if (!user) return res.json({ error: "USER_NOT_FOUND" });

    if (amount <= 0)
      return res.json({ error: "INVALID_AMOUNT" });

    if (user.tokens < amount)
      return res.json({ error: "NOT_ENOUGH_TOKENS" });

    const userJettonWallet =
      await jettonMinter.getJettonWalletAddress(
        tonweb.utils.Address.parse(address)
      );

    const walletAddress = await wallet.getAddress();
    const seqno = await wallet.methods.seqno().call();

    const jettonWallet = new tonweb.token.jetton.JettonWallet(
      tonweb.provider,
      { address: userJettonWallet }
    );

    await wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: jettonWallet.address,
      amount: TonWeb.utils.toNano("0.05"), // gas
      seqno,
      payload: await jettonWallet.createTransferBody({
        jettonAmount: TonWeb.utils.toNano(amount),
        toAddress: tonweb.utils.Address.parse(address),
        responseAddress: walletAddress
      }),
      sendMode: 3
    }).send();

    user.tokens -= amount;
    await user.save();

    res.json({
      success: true,
      message: "Jetton withdraw sent"
    });

  } catch (e) {
    console.error(e);
    res.json({ error: "JETTON_WITHDRAW_FAILED" });
  }
});

app.post("/api/market/buy", async (req, res) => {
  const { telegramId, amount } = req.body;
  const user = await User.findOne({ telegramId });
  const market = await Market.findOne();

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (!market) return res.json({ error: "MARKET_NOT_READY" });

  const price = market.reservePoints / market.reserveJetton;
  const cost = Math.ceil(amount * price);

  if (user.balance < cost)
    return res.json({ error: "NOT_ENOUGH_POINTS" });

  user.balance -= cost;
  user.tokens += amount;

  market.reservePoints += cost;
  market.reserveJetton -= amount;

  await user.save();
  await market.save();

  res.json({
    balance: user.balance,
    tokens: user.tokens,
    price
  });
});

app.post("/api/market/sell", async (req, res) => {
  const { telegramId, amount } = req.body;
  const user = await User.findOne({ telegramId });
  const market = await Market.findOne();

  if (!user) return res.json({ error: "USER_NOT_FOUND" });
  if (user.tokens < amount)
    return res.json({ error: "NOT_ENOUGH_TOKENS" });

  const price = market.reservePoints / market.reserveJetton;
  const payout = Math.floor(amount * price);

  if (market.reservePoints < payout)
    return res.json({ error: "POOL_LOW_LIQUIDITY" });

  user.tokens -= amount;
  user.balance += payout;

  market.reserveJetton += amount;
  market.reservePoints -= payout;

  await user.save();
  await market.save();

  res.json({
    balance: user.balance,
    tokens: user.tokens,
    price
  });
});

app.post("/api/market/liquidity", async (req, res) => {
  const { points, jetton } = req.body;

  const market = await Market.findOne();
  if (!market) return res.json({ error: "MARKET_NOT_READY" });

  market.reservePoints += points;
  market.reserveJetton += jetton;

  await market.save();

  res.json({ success: true, market });
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running"));
