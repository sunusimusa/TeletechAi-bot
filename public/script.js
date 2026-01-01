// ================== GAME STATE ==================
let balance = 0;
let energy = 100;
let freeTries = 3;
let tokens = 0;
let openedCount = 0;

const MAX_ENERGY = 100;
const ENERGY_REGEN = 5;
const ENERGY_TIME = 300000; // 5 minutes

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
function openBox(box) {
  if (box.classList.contains("opened")) return;

  if (freeTries > 0) {
    freeTries--;
  } else if (energy >= 10) {
    energy -= 10;
  } else {
    document.getElementById("msg").innerText = "❌ No energy!";
    return;
  }

  const rewards = [
    { type: "coin", value: 100 },
    { type: "coin", value: 200 },
    { type: "nothing", value: 0 }
  ];

  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  box.classList.add("opened");

  setTimeout(() => {
    if (reward.type === "coin") {
      balance += reward.value;
      box.innerText = "💰 " + reward.value;
    } else {
      box.innerText = "😢";
    }

    updateUI();
    saveGame();
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
    saveGame();
  }
}

// ================== CONVERT TO TOKEN ==================
function convertToToken() {
  if (balance < 10000) {
    document.getElementById("convertMsg").innerText =
      "❌ Need 10,000 points to convert!";
    return;
  }

  balance -= 10000;
  tokens += 1;

  document.getElementById("convertMsg").innerText =
    "✅ Converted to 1 TTECH!";

  updateUI();
  saveGame();
}

// ================== SAVE / LOAD ==================
function saveGame() {
  const data = {
    balance,
    energy,
    freeTries,
    tokens
  };
  localStorage.setItem("luckyBoxGame", JSON.stringify(data));
}

function loadGame() {
  const data = JSON.parse(localStorage.getItem("luckyBoxGame"));
  if (data) {
    balance = data.balance ?? 0;
    energy = data.energy ?? 100;
    freeTries = data.freeTries ?? 3;
    tokens = data.tokens ?? 0;
  }
                                            }
