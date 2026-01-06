// ================== TELEGRAM ==================
const tg = window.Telegram?.WebApp;
tg?.expand();

// ✅ REAL TELEGRAM USER ID
const TELEGRAM_ID =
  tg?.initDataUnsafe?.user?.id || null;

// ✅ REFERRAL CODE (daga Telegram start param)
const REF =
  tg?.initDataUnsafe?.start_param || null;

if (!TELEGRAM_ID) {
  alert("❌ Please open this game from Telegram");
  throw new Error("Telegram WebApp not detected");
}

// ================== GLOBAL STATE ==================
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let referralCode = "";
let referralsCount = 0;
let soundEnabled = true;
let openedCount = 0;
let openingLocked = false;

const MAX_ENERGY = 100;

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
  startEnergyRegen();
});

// ================== LOAD USER (ONLY ONE) ==================
async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: String(TELEGRAM_ID),
        ref: REF
      })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    balance = data.balance ?? 0;
    energy = data.energy ?? 0;
    tokens = data.tokens ?? 0;
    freeTries = data.freeTries ?? 0;
    referralCode = data.referralCode ?? "";
    referralsCount = data.referralsCount ?? 0;

    // 🔗 Referral link
    if (referralCode) {
      document.getElementById("refLink").value =
        `https://t.me/teletechai_bot?start=${referralCode}`;
    }

    updateUI();
  } catch (err) {
    alert("❌ Failed to load user");
    console.error(err);
  }
}

// ================== UI ==================
function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText =
    `${energy} / ${MAX_ENERGY}`;
  document.getElementById("tokens").innerText = tokens;
  document.getElementById("refCount").innerText =
    referralsCount;
}

// ================== ENERGY AUTO ==================
function startEnergyRegen() {
  setInterval(() => {
    if (energy < MAX_ENERGY) {
      energy += 1;
      updateUI();
    }
  }, 60000);
}

// ================== REFERRAL ==================
function copyRef() {
  navigator.clipboard.writeText(
    document.getElementById("refLink").value
  );
  alert("✅ Referral link copied");
}
