/* =====================================================
   GLOBAL STATE (CLEAN – ONE SOURCE)
===================================================== */

// 👑 Founder ID (KAI KADAI)
const FOUNDER_USER_ID = "SUNUSI_001";

// 👤 USER ID (BA A SA FOUNDER DEFAULT)
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "USER_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("userId", userId);
}

// WALLET (DISPLAY ONLY)
let wallet = localStorage.getItem("wallet");

// GAME STATE (DAGA SERVER)
let balance = 0;
let tokens = 0;
let energy = 0;
let freeTries = 0;
let proLevel = 0;
let MAX_ENERGY = 100;

let openingLocked = false;

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  agreementInit();
  ensureWallet();
  syncUserFromServer(); // 👈 gaskiya daga backend
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
   WALLET (FRONTEND DISPLAY)
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
   SYNC USER FROM SERVER (SOURCE OF TRUTH)
===================================================== */
async function syncUserFromServer() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    if (data.error) {
      alert("❌ Failed to load user");
      return;
    }

    // 🔁 UPDATE STATE FROM SERVER
    balance = data.balance;
    tokens = data.tokens;
    energy = data.energy;
    freeTries = data.freeTries;
    proLevel = data.proLevel;

    wallet = data.wallet;
    localStorage.setItem("wallet", wallet);

    // 👑 ROLE
    if (data.role === "founder") {
      localStorage.setItem("founder", "yes");
      MAX_ENERGY = 9999;
    } else {
      localStorage.removeItem("founder");
      MAX_ENERGY = 100;
    }

    applyProRules();
    updateUI();

  } catch (err) {
    console.error("❌ Sync failed", err);
  }
}

/* =====================================================
   PRO RULES
===================================================== */
function applyProRules() {
  if (localStorage.getItem("founder") === "yes") return;

  if (proLevel === 1) MAX_ENERGY = 150;
  if (proLevel === 2) MAX_ENERGY = 200;
  if (proLevel === 3) MAX_ENERGY = 300;

  energy = Math.min(energy, MAX_ENERGY);
}

/* =====================================================
   UI UPDATE
===================================================== */
function updateUI() {
  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
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

/* =====================================================
   BOX GAME (SERVER CONTROLLED)
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

    // 🔁 UPDATE FROM SERVER
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
    }, 1600);

  } catch (err) {
    console.error(err);
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
