/* =====================================================
   LUCKY BOX – FINAL CLEAN INDEX.JS
   NO localStorage
   SERVER = SOURCE OF TRUTH
===================================================== */

/* ================= GLOBAL STATE ================= */
let wallet = "";
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let proLevel = 0;
let role = "user";
let MAX_ENERGY = 100;

let openingLocked = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {
  handleOffline();
  await syncUser();
});

/* ================= OFFLINE ================= */
function handleOffline() {
  document.body.classList.toggle("offline", !navigator.onLine);
}
window.addEventListener("online", handleOffline);
window.addEventListener("offline", handleOffline);

/* ================= SYNC USER ================= */
async function syncUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

     USER_ID = data.userId;

    wallet = data.wallet;
    balance = data.balance;
    energy = data.energy;
    tokens = data.tokens;
    freeTries = data.freeTries;
    proLevel = data.proLevel;
    role = data.role;

    MAX_ENERGY =
      proLevel >= 4 ? 999 :
      proLevel >= 3 ? 300 :
      proLevel >= 2 ? 200 :
      proLevel >= 1 ? 150 : 100;

    updateUI();
  } catch (e) {
    console.error("SYNC ERROR", e);
  }
}

/* ================= UI ================= */
function updateUI() {
  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY || 100}`);
}
  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width = Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

/* ================= OPEN BOX ================= */
async function openBox(type) {
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
      openingLocked = false;
      return alert("❌ " + data.error);
    }

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    updateUI();
  } catch (e) {
    alert("❌ Network error");
  } finally {
    openingLocked = false;
  }
}

/* ================= DAILY BONUS ================= */
async function dailyBonus() {
  try {
    const res = await fetch("/api/daily", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    balance = data.balance;
    energy = data.energy;
    updateUI();

    alert("✅ Daily bonus claimed!");
  } catch {
    alert("❌ Network error");
  }
}

/* ================= WATCH ADS ================= */
async function watchAd() {
  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    balance = data.balance;
    energy = data.energy;
    updateUI();

    alert("✅ +20 Energy added");
  } catch {
    alert("❌ Network error");
  }
}

/* ================= CONVERT ================= */
async function convertBalance() {
  try {
    const res = await fetch("/api/convert", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    balance = data.balance;
    tokens = data.tokens;
    updateUI();

    alert("✅ Converted successfully");
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
