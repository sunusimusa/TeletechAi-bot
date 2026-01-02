// ================== TELEGRAM ==================
const TELEGRAM_ID =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";

// ================== GLOBAL STATE ==================
let balance = 0;
let energy = 0;
let tokens = 0;
let referralsCount = 0;
let referralCode = "";
let freeTries = 0;
let soundEnabled = true;

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  startEnergyRegen();
});

// ================== LOAD USER ==================
async function loadUser() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  balance = data.balance;
  energy = data.energy;
  tokens = data.tokens;
  referralsCount = data.referralsCount || 0;
  referralCode = data.referralCode;

  document.getElementById("refLink").value =
    `https://t.me/teletechai_bot?start=${referralCode}`;

  updateUI();
}

// ================== UPDATE UI ==================
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText = `Energy: ${energy}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("refCount").innerText =
    `👥 Referrals: ${referralsCount}`;
}

// ================== SOUND ==================
function playSound(type) {
  if (!soundEnabled) return;

  const sounds = {
    click: document.getElementById("clickSound"),
    win: document.getElementById("winSound"),
    lose: document.getElementById("loseSound"),
    error: document.getElementById("errorSound")
  };

  const s = sounds[type];
  if (!s) return;

  s.currentTime = 0;
  s.play().catch(() => {});
}

// ================== OPEN BOX ==================
async function openBox(box) {
  if (box.classList.contains("opened")) return;

  playSound("click");

  const res = await fetch("/api/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  if (data.error) {
    playSound("error");
    document.getElementById("msg").innerText = "❌ " + data.error;
    return;
  }

  box.classList.add("opened");

  if (data.reward === 0) {
    box.innerHTML = "😢";
    playSound("lose");
  } else {
    box.innerHTML = "💰 " + data.reward;
    playSound("win");
  }

  balance = data.balance;
  energy = data.energy;
  freeTries = data.freeTries;

  updateUI();

  setTimeout(() => {
    box.classList.remove("opened");
    box.innerHTML = "";
  }, 3000);
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
    `🎉 Daily reward +${data.reward}`;

  updateUI();
}

// ================== BUY ENERGY ==================
async function buyEnergy(amount) {
  const res = await fetch("/api/buy-energy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID, amount })
  });

  const data = await res.json();

  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  balance = data.balance;
  energy = data.energy;
  updateUI();
}

async function buyToken(amount) {
  const res = await fetch("/api/market/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

async function sellToken(amount) {
  const res = await fetch("/api/market/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    alert("❌ " + data.error);
    return;
  }

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

// ================== ENERGY AUTO REGEN ==================
function startEnergyRegen() {
  setInterval(() => {
    if (energy < 100) {
      energy += 1;
      updateUI();
    }
  }, 60000); // 1 minute
}

// ================== REFERRAL COPY ==================
function copyRef() {
  navigator.clipboard.writeText(
    document.getElementById("refLink").value
  );
  alert("✅ Referral link copied!");
}

// ================== CONVERT POINTS TO TOKEN ==================
async function convertPoints() {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID
    })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("convertMsg").innerText = "❌ " + data.error;
    return;
  }

  // update values
  balance = data.balance;
  tokens = data.tokens;

  document.getElementById("convertMsg").innerText =
    "✅ Converted successfully!";

  updateUI();
}

// ================== JOIN YOUTUBE ==================
function joinYouTube() {
  Telegram.WebApp.openLink("https://youtube.com/@Sunusicrypto");

  setTimeout(async () => {
    const res = await fetch("/api/task/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();

    if (data.error) {
      alert("Already claimed!");
    } else {
      tokens = data.tokens;
      updateUI();
      alert("🎉 You earned 10 TOKEN!");
    }
  }, 4000);
}

// ================== JOIN GROUP ==================
function joinGroup() {
  Telegram.WebApp.openLink("https://t.me/tele_tap_ai");

  setTimeout(async () => {
    const res = await fetch("/api/task/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();

    if (data.error) {
      alert("Already claimed!");
    } else {
      tokens = data.tokens;
      updateUI();
      alert("🎉 +5 TOKEN added!");
    }
  }, 4000);
}

function joinChannel() {
  Telegram.WebApp.openLink("https://t.me/TeleAIupdates");

  setTimeout(async () => {
    const res = await fetch("/api/task/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();

    if (data.error) {
      alert("Already claimed!");
    } else {
      tokens = data.tokens;
      updateUI();
      alert("🎉 +5 TOKEN added!");
    }
  }, 4000);
}
