// ================== TELEGRAM ==================
const TELEGRAM_ID =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";

const ref = Telegram.WebApp.initDataUnsafe?.start_param;

fetch("/api/user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    telegramId: TELEGRAM_ID,
    ref: ref
  })
});

// ================== GAME STATE ==================
let balance = 0;
let energy = 100;
let freeTries = 3;
let tokens = 0;
let openedCount = 0;

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  loadUser();
});

// ================== LOAD USER ==================
let referralCode = "";

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

  function showReferral() {
  const link = `https://t.me/teletechai.bot?start=${referralCode}`;
  document.getElementById("refLink").value = link;
  }

  updateUI();
  showReferral();
}

// ================== UI ==================
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText = `Energy: ${energy}`;
  document.getElementById("freeTries").innerText = `Free tries: ${freeTries}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
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

  if (data.reward === 0) {
    box.innerText = "😢";
  } else {
    box.innerText = "💰 " + data.reward;
  }

  openedCount++;
  updateUI();

  if (openedCount === 6) {
    setTimeout(resetBoxes, 2000);
  }
}

// ================== RESET BOXES ==================
function resetBoxes() {
  document.querySelectorAll(".box").forEach(b => {
    b.classList.remove("opened");
    b.innerText = "";
  });

  openedCount = 0;
  document.getElementById("msg").innerText = "";
}

function joinYouTube() {
  window.open("https://youtube.com/@YOUR_CHANNEL", "_blank");

  setTimeout(() => {
    fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        document.getElementById("ytMsg").innerText = "❌ Already claimed";
      } else {
        document.getElementById("ytMsg").innerText = "✅ Reward received!";
        balance = data.balance;
        updateUI();
      }
    });
  }, 5000);
}

function joinGroup() {
  window.open("https://t.me/your_public_group", "_blank");

  setTimeout(async () => {
    const res = await fetch("/api/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) {
      document.getElementById("groupMsg").innerText = "❌ Already claimed";
    } else {
      document.getElementById("groupMsg").innerText = "🎉 Reward added!";
      balance = data.balance;
      updateUI();
    }
  }, 5000);
}

// ================== CONVERT TOKEN ==================
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

  document.getElementById("dailyMsg").innerText = "🎉 Daily reward claimed!";
  updateUI();
      }
