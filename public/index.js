/* ================= USER ================= */
let userId = localStorage.getItem("userId");
if (!userId) {
  userId = "USER_" + Date.now();
  localStorage.setItem("userId", userId);
}

/* ================= STATE ================= */
let balance = 0;
let tokens = 0;
let energy = 0;
let freeTries = 0;
let MAX_ENERGY = 100;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  syncUser();
});

/* ================= SYNC USER ================= */
async function syncUser() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (!data.success) return;

  balance = data.balance;
  tokens = data.tokens;
  energy = data.energy;
  freeTries = data.freeTries;

  MAX_ENERGY = data.role === "founder" ? 999 : 100;

  updateUI();
}

/* ================= UI ================= */
function updateUI() {
  const safeMax = MAX_ENERGY || 100;

  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${safeMax}`);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/* ================= OPEN BOX ================= */
async function openBox(type) {
  const res = await fetch("/api/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }

  balance = data.balance;
  energy = data.energy;
  freeTries = data.freeTries;
  updateUI();
}

/* ================= DAILY ================= */
async function claimDaily() {
  const res = await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }

  balance = data.balance;
  energy = data.energy;
  updateUI();
}

/* ================= ADS ================= */
async function watchAd() {
  const res = await fetch("/api/ads/watch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }

  balance = data.balance;
  energy = data.energy;
  updateUI();
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
