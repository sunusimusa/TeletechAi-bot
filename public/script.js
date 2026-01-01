let balance = 0;
let energy = 100;
let freeTries = 3;
let tokens = 0;

function updateUI() {
  document.getElementById("balance").innerText = "Balance: " + balance;
  document.getElementById("energy").innerText = "Energy: " + energy;
  document.getElementById("freeTries").innerText = "Free tries: " + freeTries;
  document.getElementById("tokens").innerText = "Tokens: " + tokens;
}

function openBox(box) {
  if (box.classList.contains("opened")) return;

  if (freeTries > 0) {
    freeTries--;
  } else if (energy >= 10) {
    energy -= 10;
  } else {
    document.getElementById("msg").innerText = "❌ No energy or free tries!";
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
  updateUI();
}

function convertToToken() {
  if (balance < 10000) {
    document.getElementById("msg").innerText =
      "❌ Need 10,000 points to convert!";
    return;
  }

  balance -= 10000;
  tokens += 1;

  document.getElementById("msg").innerText =
    "✅ Converted to 1 TTECH!";
  updateUI();
}

updateUI();
