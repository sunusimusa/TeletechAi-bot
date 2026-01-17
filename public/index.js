/* =====================================================
   LUCKY BOX – FINAL CLEAN INDEX.JS
   SERVER = SOURCE OF TRUTH
   NO localStorage | NO FAKE STATE
===================================================== */

/* ================= GLOBAL STATE ================= */
let USER_ID = null;

let wallet = "";
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let proLevel = 0;
let role = "user";

let MAX_ENERGY = 100;
let dailyTimerInterval = null;
let openingLocked = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  handleOffline();
  syncUser();
});

/* ================= OFFLINE HANDLER ================= */
function handleOffline() {
  document.body.classList.toggle("offline", !navigator.onLine);
}
window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);

/* ================= CORE SYNC ================= */
async function syncUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    MAX_ENERGY =
      data.proLevel >= 4 ? 999 :
      data.proLevel >= 3 ? 300 :
      data.proLevel >= 2 ? 200 :
      data.proLevel >= 1 ? 150 : 100;

    updateUI();

  } catch (e) {
    console.error("SYNC ERROR", e);
  }
}

/* ================= UI ================= */
function updateUI() {
  setText("balance", `Balance: ${balance}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY}`);

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width = Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/* ================= OPEN BOX (API ONLY) ================= */
async function openBox(type, boxEl) {
  if (!navigator.onLine) {
    alert("📡 Internet required");
    return;
  }

  if (openingLocked) return;
  openingLocked = true;

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    // ✅ UPDATE STATE
    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    // 🎁 animation (script.js)
    if (boxEl && window.animateBox) {
      animateBox(boxEl, data.reward);
    }

    setTimeout(updateUI, 800);

  } catch (e) {
    console.error("OPEN BOX ERROR", e);
    alert("❌ Network error");
  } finally {
    openingLocked = false;
  }
}

/* ================= DAILY COOLDOWN ================= */
function startDailyCooldown(ms) {
  const btn = document.getElementById("dailyBtn");
  if (!btn) return;

  btn.disabled = true;
  let remaining = ms;

  clearInterval(dailyTimerInterval);
  updateDailyText(btn, remaining);

  dailyTimerInterval = setInterval(() => {
    remaining -= 1000;

    if (remaining <= 0) {
      clearInterval(dailyTimerInterval);
      btn.disabled = false;
      btn.innerText = "🎁 Daily Bonus";
      return;
    }

    updateDailyText(btn, remaining);
  }, 1000);
}

function updateDailyText(btn, ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  btn.innerText =
    `⏳ ${String(h).padStart(2, "0")}:` +
    `${String(m).padStart(2, "0")}:` +
    `${String(s).padStart(2, "0")}`;
}

/* ================= GAME ACTIONS ================= */
async function dailyBonus() {
  try {
    const res = await fetch("/api/daily", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error === "COOLDOWN") {
      startDailyCooldown(data.remaining);
      return;
    }

    if (data.error) {
      alert(data.error);
      return;
    }

    balance = data.balance;
    energy = data.energy;
    updateUI();

    alert(`🎁 +${data.rewardBalance} Balance\n⚡ +${data.rewardEnergy} Energy`);
    startDailyCooldown(24 * 60 * 60 * 1000);

  } catch {
    alert("❌ Network error");
  }
}

async function watchAd() {
  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    syncUser();
  } catch {
    alert("❌ Network error");
  }
}

async function convertBalance() {
  try {
    const res = await fetch("/api/convert", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    syncUser();
  } catch {
    alert("❌ Network error");
  }
}

/* ================= NAV ================= */
function openWallet() {
  location.href = "/wallet.html";
}

function openFounderStats() {
  location.href = "/founder-stats.html";
 }
