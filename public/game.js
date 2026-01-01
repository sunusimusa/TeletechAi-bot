// ===== TELEGRAM INIT =====
const tg = window.Telegram.WebApp;
tg.expand();
const TELEGRAM_ID = tg.initDataUnsafe?.user?.id;
const tg = Telegram.WebApp;
const params = new URLSearchParams(tg.initDataUnsafe.start_param);
const referral = params.get("ref");

// ===== GAME STATE =====
let balance = 0;
let energy = 100;
let freeTries = 3;
let tokens = 0;
let openedCount = 0;

const MAX_ENERGY = 100;
const ENERGY_REGEN = 5;
const ENERGY_TIME = 300000; // 5 minutes

// ===== LOAD GAME =====
document.addEventListener("DOMContentLoaded", () => {
  loadGame();
  setInterval(autoEnergy, ENERGY_TIME);
});

// ===== UI UPDATE =====
function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText = energy;
  document.getElementById("freeTries").innerText = freeTries;
  document.getElementById("tokens").innerText = tokens;
}

// ===== OPEN BOX =====
async function openBox(box) {
  if (box.classList.contains("opened")) return;

  const res = await fetch("/api/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();
  if (data.error) {
    document.getElementById("msg").innerText = data.error;
    return;
  }

  box.classList.add("opened");

  if (data.reward.type === "coin") {
    box.innerText = "💰 " + data.reward.value;
  } else {
    box.innerText = "😢";
  }

  balance = data.balance;
  energy = data.energy;
  freeTries = data.freeTries;

  updateUI();

  openedCount++;
  if (openedCount === 6) setTimeout(resetBoxes, 2000);
}

// ===== RESET BOXES =====
function resetBoxes() {
  document.querySelectorAll(".box").forEach(b => {
    b.classList.remove("opened");
    b.innerText = "";
  });
  openedCount = 0;
}

// ===== AUTO ENERGY =====
function autoEnergy() {
  if (energy < MAX_ENERGY) {
    energy += ENERGY_REGEN;
    if (energy > MAX_ENERGY) energy = MAX_ENERGY;
    updateUI();
  }
}

// ===== CONVERT TOKEN =====
function convertToToken() {
  if (balance < 10000) {
    document.getElementById("convertMsg").innerText =
      "❌ Need 10,000 points";
    return;
  }

  balance -= 10000;
  tokens += 1;
  updateUI();
}

// ===== LOAD FROM SERVER =====
function loadGame() {
  fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  })
    .then(r => r.json())
    .then(data => {
      balance = data.balance;
      energy = data.energy;
      freeTries = data.freeTries;
      tokens = data.tokens;
      updateUI();
    });
    }
