/* =====================================================
   LUCKY BOX GAME – CLEAN FRONTEND (INDEX.JS)
   SERVER = SOURCE OF TRUTH
===================================================== */

/* ================= USER ID ================= */
let userId = localStorage.getItem("userId");
if (!userId) {
  userId =
    "USER_" +
    Date.now() +
    "_" +
    Math.random().toString(36).substring(2, 6);
  localStorage.setItem("userId", userId);
}

/* ================= GLOBAL STATE ================= */
let balance = 0;
let energy = 0;
let freeTries = 0;
let tokens = 0;
let referralsCount = 0;
let MAX_ENERGY = 100;
let openingLocked = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  syncUserFromServer();
});

/* ================= SYNC USER ================= */
async function syncUserFromServer() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();

    if (data.error) {
      console.warn("SYNC ERROR:", data.error);
      return;
    }

    balance = data.balance ?? 0;
    energy = data.energy ?? 0;
    freeTries = data.freeTries ?? 0;
    tokens = data.tokens ?? 0;
    referralsCount = data.referralsCount ?? 0;
    MAX_ENERGY = data.role === "founder" ? 9999 : 100;

    updateUI();
  } catch (err) {
    console.error("SYNC FAILED", err);
  }
}

/* ================= UI ================= */
function updateUI() {
  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY}`);

  const bar = document.getElementById("energyFill");
  if (bar) {
    const percent = MAX_ENERGY > 0 ? (energy / MAX_ENERGY) * 100 : 0;
    bar.style.width = Math.min(percent, 100) + "%";
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/* ================= OPEN BOX ================= */
async function openBox(type) {
  if (openingLocked) return;
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

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    updateUI();
  } catch (e) {
    alert("❌ Network error");
  }

  setTimeout(() => {
    openingLocked = false;
  }, 1200);
}

/* ================= DAILY BONUS ================= */
async function claimDaily() {
  const res = await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) {
    alert("⏳ Come back later");
    return;
  }

  balance = data.balance;
  energy = data.energy;
  updateUI();

  alert("🎁 Daily reward claimed!");
}

/* ================= WATCH ADS ================= */
async function watchAd() {
  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");

  if (!btn || !status) return;

  btn.disabled = true;
  status.innerText = "⏳ Watching ad (30s)...";

  setTimeout(async () => {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();

    if (data.error) {
      status.innerText = "❌ " + data.error;
    } else {
      energy = data.energy;
      balance = data.balance;
      updateUI();
      status.innerText = "✅ +20 Energy added!";
    }

    btn.disabled = false;
    setTimeout(() => (status.innerText = ""), 2000);
  }, 30000);
}

/* ================= SOCIAL ================= */
function joinYouTube(e) {
  e.preventDefault();
  window.open("https://www.youtube.com/@Sunusicrypto", "_blank");
  setText("ytMsg", "✅ Opened YouTube");
}

function joinGroup(e) {
  e.preventDefault();
  window.open("https://t.me/tele_tap_ai", "_blank");
  setText("groupMsg", "✅ Opened Community Group");
}

function joinChannel(e) {
  e.preventDefault();
  window.open("https://t.me/TeleAIupdates", "_blank");
  setText("channelMsg", "✅ Opened Channel");
    }
