// ================= TELEGRAM =================
const TELEGRAM_ID =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";

// ================= GAME STATE =================
let balance = 0;
let energy = 100;
let freeTries = 3;
let tokens = 0;
let referralCode = "";
let referralsCount = 0;
let openedCount = 0;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
});

// ================= LOAD USER =================
async function loadUser() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  balance = data.balance;
  energy = data.energy;
  freeTries = data.freeTries;
  tokens = data.tokens;
  referralCode = data.referralCode;
  referralsCount = data.referralsCount || 0;

  updateUI();
  showReferral();
}

// ================= UI =================
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText = `Energy: ${energy}`;
  document.getElementById("freeTries").innerText = `Free tries: ${freeTries}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("refCount").innerText = `👥 Referrals: ${referralsCount}`;
}

// ================= REFERRAL =================
function showReferral() {
  const link = `https://t.me/teletechai_bot?start=${referralCode}`;
  document.getElementById("refLink").value = link;
}

function copyRef() {
  const input = document.getElementById("refLink");
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value);
  alert("✅ Referral link copied!");
}

// ================= OPEN BOX =================
async function openBox(box) {
  if (box.classList.contains("opened")) return;

  const res = await fetch("/api/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("msg").innerText = "❌ " + data.error;
    return;
  }

  balance = data.balance;
  energy = data.energy;
  freeTries = data.freeTries;

  box.classList.add("opened");
  box.innerText = data.reward === 0 ? "😢" : `💰 ${data.reward}`;

  updateUI();
}

// ================= DAILY =================
async function claimDaily() {
  const res = await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("dailyMsg").innerText = "❌ " + data.error;
    return;
  }

  balance = data.balance;
  energy = data.energy;

  document.getElementById("dailyMsg").innerText = "🎉 Daily reward claimed!";
  updateUI();
}

// ================= CONVERT =================
async function convertToToken() {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("convertMsg").innerText = "❌ " + data.error;
    return;
  }

  tokens = data.tokens;
  balance = data.balance;

  document.getElementById("convertMsg").innerText = "✅ Converted to 1 TTECH";
  updateUI();
    }
