/* =====================================================
   LUCKY BOX – CLEAN FINAL FRONTEND
   SERVER = SOURCE OF TRUTH
   PLAY STORE SAFE
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
let energy = 0;
let tokens = 0;
let freeTries = 0;
let proLevel = 0;
let referralsCount = 0;
let MAX_ENERGY = 100;

let openingLocked = false;
let adWatched = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  agreementInit();
  handleOffline();
  await ensureUser();
});

/* ================= SOUND ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// Android unlock
document.addEventListener(
  "click",
  () => {
    ["clickSound", "winSound", "loseSound", "errorSound"].forEach(id => {
      const s = document.getElementById(id);
      if (s) s.play().then(() => s.pause()).catch(() => {});
    });
  },
  { once: true }
);

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

function openLeaderboard() {
  location.href = "/leaderboard.html";
}

/* ================= OFFLINE ================= */
function handleOffline() {
  document.body.classList.toggle("offline", !navigator.onLine);
}
window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);

/* ================= USER SYNC ================= */
async function ensureUser() {
  if (window.__synced) return;
  window.__synced = true;
  await syncUserFromServer();
}

async function syncUserFromServer() {
  try {
    const ref = new URLSearchParams(location.search).get("ref");

    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ref })
    });

    const data = await res.json();
    if (!data.success) return;

    wallet = data.wallet;
    balance = data.balance;
    energy = data.energy;
    tokens = data.tokens;
    freeTries = data.freeTries;
    proLevel = data.proLevel;
    referralsCount = data.referralsCount || 0;

    // energy limits
    MAX_ENERGY = data.role === "founder" ? 999 : 100;
    if (proLevel === 1) MAX_ENERGY = 150;
    if (proLevel === 2) MAX_ENERGY = 200;
    if (proLevel === 3) MAX_ENERGY = 300;

    updateUI();
    fillReferralLink();
  } catch (e) {
    console.error("SYNC ERROR", e);
  }
}

/* ================= UI ================= */
function updateUI() {
  const safeMax = MAX_ENERGY > 0 ? MAX_ENERGY : 100;

  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${safeMax}`);
  setText("refCount", `👥 Referrals: ${referralsCount}`);

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width =
      Math.min((energy / safeMax) * 100, 100) + "%";
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/* ================= REFERRAL ================= */
function fillReferralLink() {
  const input = document.getElementById("refLink");
  if (input && wallet) input.value = location.origin + "/?ref=" + wallet;
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
  if (!navigator.onLine) {
    alert("📡 Internet required");
    return;
  }
  if (openingLocked || box.classList.contains("opened")) return;

  openingLocked = true;
  playSound("clickSound");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type })
    });

    const data = await res.json();
    if (data.error) {
      playSound("errorSound");
      openingLocked = false;
      return alert("❌ " + data.error);
    }

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    const rewardEl = box.querySelector(".reward");
    box.classList.add("opened");

    if (data.reward > 0) {
      playSound("winSound");
      rewardEl.textContent = `+${data.reward}`;
    } else {
      playSound("loseSound");
      rewardEl.textContent = "Empty";
    }

    rewardEl.classList.remove("hidden");
    updateUI();

    setTimeout(() => {
      box.classList.remove("opened");
      rewardEl.classList.add("hidden");
      rewardEl.textContent = "";
      openingLocked = false;
    }, 1500);
  } catch {
    openingLocked = false;
  }
}

/* ================= ADS ================= */
async function watchAd() {
  if (!navigator.onLine) return alert("📡 Internet required");

  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");
  if (!btn || !status) return;

  btn.disabled = true;
  let t = 30;
  status.classList.remove("hidden");
  status.innerText = `⏳ Watching ad... ${t}s`;

  const timer = setInterval(() => {
    t--;
    status.innerText = `⏳ Watching ad... ${t}s`;
    if (t <= 0) {
      clearInterval(timer);
      claimAdReward(btn, status);
    }
  }, 1000);
}

async function claimAdReward(btn, status) {
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
    status.innerText = "✅ +20 Energy added!";
  } finally {
    setTimeout(() => {
      status.classList.add("hidden");
      btn.disabled = false;
    }, 2000);
  }
}

/* ================= CONVERT ================= */
async function convertBalance() {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount: 10000 })
  });

  const data = await res.json();
  if (data.error) return alert("❌ " + data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
  alert("✅ Converted successfully");
}

/* ================= NAV ================= */
function openWallet() {
  location.href = "/wallet.html";
}
function openFounderStats() {
  location.href = "/founder-stats.html";
}
function linkTelegram() {
  window.open(`https://t.me/TeleTechAiBot?start=${userId}`, "_blank");
       }
