// ================== TELEGRAM ==================
const TELEGRAM_ID =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "guest";

// ================== GLOBAL STATE ==================
let balance = 0;
let energy = 0;
let tokens = 0;
let referralsCount = 0;
let referralCode = "";

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
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

function playSound(type) {
  if (!soundEnabled) return;

  let sound;

  if (type === "click") sound =
    document.getElementById("clickSound");
  if (type === "win") sound =
    document.getElementById("winSound");
  if (type === "lose") sound =
    document.getElementById("loseSound");
  if (type === "error") sound =
    document.getElementById("errorSound");

  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
}

// ================== COPY REF ==================
function copyRef() {
  navigator.clipboard.writeText(
    document.getElementById("refLink").value
  );
  alert("✅ Referral link copied!");
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

  // ⏱️ close box after 3 seconds
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

  energy = data.energy;
  balance = data.balance;
  updateUI();
}

// ================== JOIN YOUTUBE ==================
function joinYouTube() {
  Telegram.WebApp.openLink("https://youtube.com/@Sunusicrypto");

  setTimeout(async () => {
    const res = await fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();

    document.getElementById("ytMsg").innerText =
      data.error ? "❌ Already claimed" : "🎉 Reward added";

    if (!data.error) {
      balance = data.balance;
      updateUI();
    }
  }, 4000);
}

// ================== JOIN GROUP ==================
function joinGroup() {
  Telegram.WebApp.openLink("https://t.me/tele_tap_ai");

  setTimeout(async () => {
    const res = await fetch("/api/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();

    document.getElementById("groupMsg").innerText =
      data.error ? "❌ Already claimed" : "🎉 Reward added";

    if (!data.error) {
      balance = data.balance;
      updateUI();
    }
  }, 4000);
}
