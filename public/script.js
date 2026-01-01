let balance = 0;
let energy = 100;
let freeTries = 3;
let tokens = 0;
let openedCount = 0;

// ================= LOAD GAME =================
document.addEventListener("DOMContentLoaded", () => {
  loadGame();
});

// ================= UPDATE UI =================
function updateUI() {
  document.getElementById("balance").innerText = "Balance: " + balance;
  document.getElementById("energy").innerText = "Energy: " + energy;
  document.getElementById("freeTries").innerText = "Free tries: " + freeTries;
  document.getElementById("tokens").innerText = "Tokens: " + tokens;

  saveGame();
}

// ================= OPEN BOX =================
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

  if (reward.type === "coin") {
    balance += reward.value;
    box.innerText = "💰 " + reward.value;
  } else {
    box.innerText = "😢";
  }

  box.classList.add("opened");
  openedCount++;

  updateUI();

  // idan an bude duka
  if (openedCount === 6) {
    setTimeout(resetBoxes, 2000);
  }
}

const TELEGRAM_ID = Telegram.WebApp?.initDataUnsafe?.user?.id || "test_user";

async function openBox() {
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

  updateUI();
}

// ================= RESET BOXES =================
function resetBoxes() {
  document.querySelectorAll(".box").forEach(box => {
    box.classList.remove("opened");
    box.innerText = "";
  });

  openedCount = 0;
  document.getElementById("msg").innerText = "";
}

// ================= CONVERT TO TOKEN =================
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

// ================= SAVE / LOAD =================
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

  updateUI();
}
