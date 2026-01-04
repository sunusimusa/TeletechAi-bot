// ===== TELEGRAM INIT =====
const tg = window.Telegram.WebApp;
tg.expand();

const TELEGRAM_ID = tg.initDataUnsafe?.user?.id || "guest";
const referral = tg.initDataUnsafe?.start_param || null;

// ===== GAME STATE (DISPLAY ONLY) =====
let balance = 0;
let energy = 0;
let freeTries = 0;
let tokens = 0;
let openedCount = 0;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
});

// ===== LOAD USER FROM SERVER =====
async function loadUser() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      ref: referral
    })
  });

  const data = await res.json();

  balance = data.balance;
  energy = data.energy;
  freeTries = data.freeTries;
  tokens = data.tokens;

  updateUI();
}

// ===== UI UPDATE =====
function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText = energy;
  document.getElementById("freeTries").innerText = freeTries;
  document.getElementById("tokens").innerText = tokens;
}

// ===== OPEN BOX (SERVER CONTROLS ENERGY) =====
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

  box.classList.add("opened");

  if (data.reward === 0) {
    box.innerText = "😢";
  } else {
    box.innerText = "💰 " + data.reward;
  }

  balance = data.balance;
  energy = data.energy;
  freeTries = data.freeTries;

  updateUI();

  setTimeout(() => {
    box.classList.remove("opened");
    box.innerText = "";
  }, 3000);

  openedCount++;
  if (openedCount === 6) {
    setTimeout(resetBoxes, 2000);
  }
}

// ===== RESET BOXES =====
function resetBoxes() {
  document.querySelectorAll(".box").forEach(b => {
    b.classList.remove("opened");
    b.innerText = "";
  });
  openedCount = 0;
}

function upgradePro(level) {
  fetch("/api/pro/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID, level })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) return alert(d.error);
    alert("✅ PRO Level " + d.proLevel + " unlocked!");
    loadUser();
  });
}

// ===== CONVERT POINTS → TOKEN (SERVER) =====
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

  balance = data.balance;
  tokens = data.tokens;

  document.getElementById("convertMsg").innerText =
    "✅ Converted successfully";

  updateUI();
}
