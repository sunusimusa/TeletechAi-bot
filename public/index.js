/* =====================================================
   FULL CLEAN FRONTEND (index.js)
   SERVER = SOURCE OF TRUTH
===================================================== */

/* ================= USER ID ================= */
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "USER_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  localStorage.setItem("userId", userId);
}

/* ================= GLOBAL STATE ================= */
let wallet = "";
let balance = 0;
let tokens = 0;
let freeTries = 0;
let energy = 0;
let referralsCount = 0;
let proLevel = 0;
let role = "user";

let MAX_ENERGY = 100;
let openingLocked = false;
let adWatched = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  agreementInit();
  handleOffline();
  await syncUserFromServer();
});

/* ================= AGREEMENT ================= */
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

/* ================= OFFLINE ================= */
function handleOffline() {
  document.body.classList.toggle("offline", !navigator.onLine);
}
window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);

/* ================= SERVER SYNC ================= */
async function syncUserFromServer() {
  try {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ref })
    });

    const data = await res.json();
    if (!data.success) return;

    wallet = data.wallet;
    balance = data.balance;
    tokens = data.tokens;
    freeTries = data.freeTries;
    energy = data.energy;
    referralsCount = data.referralsCount || 0;
    proLevel = data.proLevel || 0;
    role = data.role || "user";

    // 🔒 ENERGY LIMITS
    MAX_ENERGY = 100;
    if (proLevel === 1) MAX_ENERGY = 150;
    if (proLevel === 2) MAX_ENERGY = 200;
    if (proLevel === 3) MAX_ENERGY = 300;
    if (role === "founder") MAX_ENERGY = 9999;

    updateUI();
    fillReferralLink();
  } catch (e) {
    console.error("SYNC ERROR", e);
  }
}

/* ================= UI ================= */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function updateUI() {
  const safeMax = MAX_ENERGY > 0 ? MAX_ENERGY : 100;

  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${safeMax}`);
  setText("refCount", `👥 Referrals: ${referralsCount}`);

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width = Math.min((energy / safeMax) * 100, 100) + "%";
  }
}

/* ================= REFERRAL ================= */
function fillReferralLink() {
  const input = document.getElementById("refLink");
  if (input && wallet) {
    input.value = location.origin + "/?ref=" + wallet;
  }
}

function copyRef() {
  const input = document.getElementById("refLink");
  if (!input) return;
  input.select();
  document.execCommand("copy");
  alert("✅ Referral link copied");
}

/* ================= OPEN BOX ================= */
async function openBox(box, type) {
  if (!navigator.onLine) return alert("📡 Internet required");
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
      openingLocked = false;
      if (data.error === "USER_NOT_FOUND") {
        await syncUserFromServer();
        return;
      }
      return alert("❌ " + data.error);
    }

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    updateUI();
  } catch {
    alert("❌ Network error");
  } finally {
    openingLocked = false;
  }
}

/* ================= ADS → ENERGY ONLY ================= */
async function watchAd() {
  if (!navigator.onLine) return alert("📡 Internet required");

  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");
  if (!btn || !status) return;

  btn.disabled = true;
  adWatched = false;

  let t = 30;
  status.classList.remove("hidden");
  status.innerText = `⏳ Watching ad... ${t}s`;

  const timer = setInterval(() => {
    t--;
    status.innerText = `⏳ Watching ad... ${t}s`;
    if (t <= 0) {
      clearInterval(timer);
      adWatched = true;
      claimAdReward(btn, status);
    }
  }, 1000);
}

async function claimAdReward(btn, status) {
  if (!adWatched) return;

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();

    if (data.error) {
      status.innerText = "❌ " + data.error;
      btn.disabled = false;
      return;
    }

    energy = data.energy;
    balance = data.balance;
    updateUI();

    status.innerText = "✅ +20 Energy added";
  } catch {
    status.innerText = "❌ Network error";
  } finally {
    adWatched = false;
    setTimeout(() => {
      status.classList.add("hidden");
      btn.disabled = false;
    }, 2000);
  }
}

/* ================= CONVERT ================= */
async function convertBalance() {
  const amount = 10000;

  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount })
  });

  const data = await res.json();
  if (data.error) return alert("❌ " + data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

/* ================= NAV ================= */
function openStats() {
  location.href = "/stats.html";
}
function openBurns() {
  location.href = "/burn.html";
}
function openLeaderboard() {
  location.href = "/leaderboard.html";
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
