/* =====================================================
   GLOBAL STATE (BROWSER ONLY – CLEAN & SAFE)
===================================================== */

// 👑 Founder ID (KAI KADAI)
const FOUNDER_USER_ID = "SUNUSI_001";

// 👤 USER ID (BA A TAƁA SA FOUNDER DEFAULT)
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "USER_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("userId", userId);
}

// WALLET
let wallet = localStorage.getItem("wallet");

// GAME STATE (CACHE)
let balance = Number(localStorage.getItem("balance")) || 0;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let energy = Number(localStorage.getItem("energy")) || 50;
let freeTries = Number(localStorage.getItem("freeTries")) || 3;
let referralsCount = Number(localStorage.getItem("referralsCount")) || 0;
let proLevel = Number(localStorage.getItem("proLevel")) || 0;

// LIMITS
let MAX_ENERGY = 100;
let MAX_FREE_TRIES = 3;

let openingLocked = false;

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  ensureWallet();
  agreementInit();
  handleReferralJoin();
  syncUserFromServer(); // 👈 GASKIYA DAGA BACKEND
});

/* =====================================================
   AGREEMENT
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
   WALLET + REFERRAL LINK
===================================================== */
function ensureWallet() {
  if (!wallet) {
    wallet =
      "TTECH-" +
      Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem("wallet", wallet);
  }

  const refLink = document.getElementById("refLink");
  if (refLink) {
    refLink.value = location.origin + "/?ref=" + wallet;
  }
}

/* =====================================================
   REFERRAL (FIRST VISIT ONLY)
===================================================== */
function handleReferralJoin() {
  const params = new URLSearchParams(location.search);
  const ref = params.get("ref");

  if (!ref) return;
  if (localStorage.getItem("joinedByRef") === "yes") return;
  if (ref === wallet) return;

  balance += 300;
  energy = Math.min(energy + 20, MAX_ENERGY);

  localStorage.setItem("joinedByRef", "yes");
  saveState();
}

/* =====================================================
   SYNC FROM SERVER (SOURCE OF TRUTH)
===================================================== */
async function syncUserFromServer() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if (data.error) return;

    balance = data.balance;
    tokens = data.tokens;
    energy = data.energy;
    freeTries = data.freeTries;
    proLevel = data.proLevel;

    wallet = data.wallet;
    localStorage.setItem("wallet", wallet);

    if (data.role === "founder") {
      localStorage.setItem("founder", "yes");
      MAX_ENERGY = 9999;
      MAX_FREE_TRIES = 9999;
    } else {
      localStorage.removeItem("founder");
      MAX_ENERGY = 100;
      MAX_FREE_TRIES = 3;
    }

    applyProRules();
    updateUI();
  } catch (err) {
    console.error("❌ Sync failed", err);
  }
}

/* =====================================================
   PRO RULES (BA YA SHAFAR FOUNDER)
===================================================== */
function applyProRules() {
  if (localStorage.getItem("founder") === "yes") return;

  if (proLevel === 1) MAX_ENERGY = 150;
  if (proLevel === 2) MAX_ENERGY = 200;
  if (proLevel === 3) MAX_ENERGY = 300;

  energy = Math.min(energy, MAX_ENERGY);
  freeTries = Math.min(freeTries, MAX_FREE_TRIES);
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
    bar.style.width =
      Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
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
   BOX GAME (WITH IMAGE)
===================================================== */
async function openBox(box, type) {
  if (openingLocked || box.classList.contains("opened")) return;
  openingLocked = true;

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type })
    });

    const data = await res.json();

    if (data.error) {
      alert("❌ " + data.error);
      openingLocked = false;
      return;
    }

    // UPDATE FROM SERVER
    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    const rewardEl = box.querySelector(".reward");
    box.classList.add("opened");
    rewardEl.textContent =
      data.reward > 0 ? `💰 +${data.reward}` : "😢 Empty";
    rewardEl.classList.remove("hidden");

    updateUI();

    setTimeout(() => {
      box.classList.remove("opened");
      rewardEl.classList.add("hidden");
      rewardEl.textContent = "";
      openingLocked = false;
    }, 1800);

  } catch (e) {
    console.error(e);
    openingLocked = false;
  }
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
