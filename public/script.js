// ================== GAME STATE ==================
let balance = 0;
let energy = 100;
let freeTries = 3;
let tokens = 0;
let openedCount = 0;

const MAX_ENERGY = 100;
const ENERGY_REGEN = 5;
const ENERGY_TIME = 300000; // 5 minutes

const TELEGRAM_ID = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";

// ================== LOAD GAME ==================
document.addEventListener("DOMContentLoaded", () => {
  loadGame();
  updateUI();
  setInterval(autoEnergy, ENERGY_TIME);
});

// ================== UPDATE UI ==================
function updateUI() {
  document.getElementById("balance").innerText = "Balance: " + balance;
  document.getElementById("energy").innerText = "Energy: " + energy;
  document.getElementById("freeTries").innerText = "Free tries: " + freeTries;
  document.getElementById("tokens").innerText = "Tokens: " + tokens;
}

// ================== OPEN BOX ==================
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

  setTimeout(() => {
    if (data.reward?.type === "coin") {
      box.innerText = "💰 " + data.reward.value;
    } else {
      box.innerText = "😢";
    }

    updateUI();
  }, 300);

  openedCount++;

  if (openedCount === 6) {
    setTimeout(resetBoxes, 2000);
  }
}

// ================== RESET BOXES ==================
function resetBoxes() {
  document.querySelectorAll(".box").forEach(box => {
    box.classList.remove("opened");
    box.innerText = "";
  });

  openedCount = 0;
  document.getElementById("msg").innerText = "";
}

// ================== AUTO ENERGY ==================
function autoEnergy() {
  if (energy < MAX_ENERGY) {
    energy += ENERGY_REGEN;
    if (energy > MAX_ENERGY) energy = MAX_ENERGY;
    updateUI();
  }
}

function withdraw() {
  const wallet = document.getElementById("wallet").value;
  const amount = Number(document.getElementById("amount").value);

  if (!wallet || amount <= 0) {
    document.getElementById("withdrawMsg").innerText = "❌ Fill all fields";
    return;
  }

  fetch("/api/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      amount,
      wallet
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById("withdrawMsg").innerText = "❌ " + data.error;
      } else {
        document.getElementById("withdrawMsg").innerText =
          "✅ Withdraw request sent!";
        tokens = data.tokens;
        updateUI();
      }
    });
}

// ================== CONVERT TO TOKEN ==================
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

  document.getElementById("convertMsg").innerText =
    "✅ Converted to 1 TTECH!";

  updateUI();
}

// ================== DAILY BONUS ==================
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

  document.getElementById("dailyMsg").innerText =
    "🎉 Daily reward claimed!";

  updateUI();
    }
