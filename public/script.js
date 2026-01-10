/* =====================================================
   GLOBAL STATE (BROWSER ONLY – CLEAN)
===================================================== */
const FOUNDER_USER_ID = "SUNUSI_001";

let userId = localStorage.getItem("userId") || FOUNDER_USER_ID;

let balance = Number(localStorage.getItem("balance")) || 0;
let tokens  = Number(localStorage.getItem("tokens")) || 10;
let energy  = Number(localStorage.getItem("energy")) || 50;
let freeTries = Number(localStorage.getItem("freeTries")) || 3;
let referralsCount = Number(localStorage.getItem("referralsCount")) || 0;

let proLevel = Number(localStorage.getItem("proLevel")) || 0;
let MAX_ENERGY = 100;
let openingLocked = false;

/* =====================================================
   FOUNDER AUTO
===================================================== */
if (userId === FOUNDER_USER_ID) {
  proLevel = 4;
  MAX_ENERGY = 9999;
  energy = 9999;
  freeTries = 9999;
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  ensureWallet();
  agreementInit();
  applyProRules();
  updateUI();
});

/* =====================================================
   AGREEMENT (ONE ONLY – FIXED)
===================================================== */
function agreementInit() {
  const modal = document.getElementById("agreementModal");
  const btn = document.getElementById("agreeBtn");

  if (!modal || !btn) return;

  if (localStorage.getItem("agreed") === "yes") {
    modal.classList.add("hidden");
  } else {
    modal.classList.remove("hidden");
  }

  btn.onclick = () => {
    localStorage.setItem("agreed", "yes");
    modal.classList.add("hidden");
  };
}

/* =====================================================
   WALLET (LOCAL ONLY)
===================================================== */
function ensureWallet() {
  let wallet = localStorage.getItem("wallet");
  if (!wallet) {
    wallet = "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("wallet", wallet);
  }

  const refLink = document.getElementById("refLink");
  if (refLink) {
    refLink.value = location.origin + "/?ref=" + wallet;
  }
}

/* =====================================================
   PRO RULES
===================================================== */
function applyProRules() {
  if (proLevel === 1) MAX_ENERGY = 150;
  if (proLevel === 2) MAX_ENERGY = 200;
  if (proLevel === 3) MAX_ENERGY = 300;
  if (proLevel >= 4) MAX_ENERGY = 9999;

  energy = Math.min(energy, MAX_ENERGY);
}

/* =====================================================
   UI UPDATE
===================================================== */
function updateUI() {
  saveState();

  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("refCount", `👥 Referrals: ${referralsCount}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY}`);

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width = Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
  }

  const proBadge = document.getElementById("proBadge");
  if (proBadge) {
    if (proLevel >= 1) {
      proBadge.classList.remove("hidden");
      proBadge.innerText = proLevel >= 4 ? "👑 FOUNDER" : "⭐ PRO MEMBER";
    } else {
      proBadge.classList.add("hidden");
    }
  }

  const founderActions = document.getElementById("founderActions");
  if (founderActions) {
    if (proLevel >= 4) founderActions.classList.remove("hidden");
    else founderActions.classList.add("hidden");
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function saveState() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("tokens", tokens);
  localStorage.setItem("energy", energy);
  localStorage.setItem("freeTries", freeTries);
  localStorage.setItem("proLevel", proLevel);
  localStorage.setItem("referralsCount", referralsCount);
  localStorage.setItem("userId", userId);
}

/* =====================================================
   SOUNDS (SAFE)
===================================================== */
function playSound(id) {
  const s = document.getElementById(id);
  if (s) {
    s.currentTime = 0;
    s.play().catch(() => {});
  }
}

/* =====================================================
   OPEN BOX (GAME)
===================================================== */
function openBox(box) {
  if (openingLocked) return;
  openingLocked = true;

  playSound("clickSound");

  if (freeTries > 0) {
    freeTries--;
  } else if (energy >= 10) {
    energy -= 10;
  } else {
    alert("❌ Not enough energy");
    openingLocked = false;
    return;
  }

  let rewards = [0, 100, 200];
  if (proLevel === 2) rewards = [100, 200, 500];
  if (proLevel === 3) rewards = [200, 500, 1000];
  if (proLevel >= 4) rewards = [500, 1000, 2000];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  balance += reward;

  box.classList.add("opened");
  box.innerText = reward > 0 ? `💰 ${reward}` : "😢";
  playSound(reward > 0 ? "winSound" : "loseSound");

  updateUI();

  setTimeout(() => {
    box.classList.remove("opened");
    box.innerText = "";
    openingLocked = false;
  }, 1200);
}

/* =====================================================
   DAILY BONUS
===================================================== */
function claimDaily() {
  const last = Number(localStorage.getItem("lastDaily")) || 0;
  const now = Date.now();

  if (now - last < 24 * 60 * 60 * 1000) {
    alert("⏳ Come back tomorrow");
    return;
  }

  let reward = 500;
  if (proLevel === 1) reward *= 1.3;
  if (proLevel === 2) reward *= 1.7;
  if (proLevel >= 3) reward *= 2;

  balance += Math.floor(reward);
  energy = Math.min(MAX_ENERGY, energy + 10);

  localStorage.setItem("lastDaily", now);
  updateUI();
  alert("🎁 Daily bonus claimed!");
}

/* =====================================================
   MARKET
===================================================== */
function convertPoints() {
  if (balance < 10000) {
    alert("❌ Not enough balance");
    return;
  }
  balance -= 10000;
  tokens += 1;
  updateUI();
}

function buyToken() {
  convertPoints();
}

function sellToken() {
  if (tokens < 1) {
    alert("❌ No tokens");
    return;
  }
  tokens -= 1;
  balance += 8000;
  updateUI();
}

/* =====================================================
   BUY ENERGY
===================================================== */
function buyEnergy(amount) {
  const cost = amount === 100 ? 500 : 2000;
  if (balance < cost) {
    alert("❌ Not enough coins");
    return;
  }
  balance -= cost;
  energy = Math.min(MAX_ENERGY, energy + amount);
  updateUI();
}

/* =====================================================
   PRO UPGRADE
===================================================== */
function upgradePro(level = 1) {
  const prices = { 1: 5, 2: 10, 3: 20 };

  if (proLevel >= level) {
    alert("Already upgraded");
    return;
  }

  if (tokens < prices[level]) {
    alert("❌ Not enough tokens");
    return;
  }

  tokens -= prices[level];
  proLevel = level;
  applyProRules();
  updateUI();

  alert(`🚀 PRO Level ${level} activated`);
}

/* =====================================================
   NAVIGATION
===================================================== */
function openWallet() {
  location.href = "/wallet.html";
}

function openFounderStats() {
  location.href = "/founder-stats.html";
}
