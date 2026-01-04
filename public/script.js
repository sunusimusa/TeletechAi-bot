// ================== TELEGRAM ==================
const tg = window.Telegram?.WebApp;
tg?.expand();

const TELEGRAM_ID = tg?.initDataUnsafe?.user?.id || "guest";

// ================== GLOBAL STATE ==================
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;
let referralCode = "";
let referralsCount = 0;
let soundEnabled = true;
let openedCount = 0;
let openingLocked = false;

const MAX_ENERGY = 100;

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  startEnergyRegen(); // ⚡ auto energy
});

// ================== LOAD USER ==================
async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    balance = data.balance ?? 0;
    energy = data.energy ?? 0;
    tokens = data.tokens ?? 0;
    freeTries = data.freeTries ?? 0;
    referralCode = data.referralCode ?? "";
    referralsCount = data.referralsCount ?? 0;

    // ✅ PRO STATUS (a nan kawai!)
    if (data.isPro) {
      document.getElementById("proBadge")?.classList.remove("hidden");
      document.getElementById("upgradeBtn")?.style.setProperty("display", "none");
    }

    if (data.proLevel >= 2) {
      document.getElementById("proLv2Btn")?.style.setProperty("display", "none");
    }

    if (data.proLevel >= 3) {
      document.getElementById("proLv3Btn")?.style.setProperty("display", "none");
    }

    if (referralCode) {
      document.getElementById("refLink").value =
        `https://t.me/teletechai_bot?start=${referralCode}`;
    }

    updateUI();
  } catch (err) {
    alert("❌ Failed to load user");
    console.error(err);
  }
}

// ================== UI UPDATE ==================
function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText =
    `Energy: ${energy} / ${MAX_ENERGY}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("refCount").innerText =
    `👥 Referrals: ${referralsCount}`;
}

// ================== ENERGY AUTO REGEN ==================
function startEnergyRegen() {
  setInterval(() => {
    if (energy < MAX_ENERGY) {
      energy += 1;
      updateUI();
    }
  }, 60000); // every 1 minute
}

// ================== SOUND ==================
function playSound(type) {
  if (!soundEnabled) return;

  const sounds = {
    click: "clickSound",
    win: "winSound",
    lose: "loseSound",
    error: "errorSound"
  };

  const audio = document.getElementById(sounds[type]);
  if (!audio) return;

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// ================== OPEN BOX ==================
async function openBox(box) {
  if (openingLocked) return;
  if (box.classList.contains("opened")) return;

  openingLocked = true;
  playSound("click");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    // 🔓 Buɗe box
    box.classList.add("opened");

    if (data.reward === 0) {
      box.innerText = "😢";
      playSound("lose");
    } else {
      box.innerText = `💰 ${data.reward}`;
      playSound("win");
    }

    // update state
    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;
    updateUI();

    openedCount++;

    // ⏱️ rufe wannan box bayan 1.5s
    setTimeout(() => {
      box.classList.remove("opened");
      box.innerText = "";
    }, 1500);

    // ⏱️ sake bada damar buɗe wani box
    setTimeout(() => {
      openingLocked = false;
    }, 300);

    // 🔄 idan an buɗe 6 → reset duka
    if (openedCount >= 6) {
      setTimeout(resetAllBoxes, 1800);
    }

  } catch (err) {
    playSound("error");
    document.getElementById("msg").innerText = err;
    openingLocked = false;
  }
}

function resetAllBoxes() {
  document.querySelectorAll(".box").forEach(box => {
    box.classList.remove("opened");
    box.innerText = "";
  });
  openedCount = 0;
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
    document.getElementById("dailyMsg").innerText = data.error;
    return;
  }

  balance = data.balance;
  energy = data.energy;

  document.getElementById("dailyMsg").innerText =
    `🎉 Daily reward +${data.reward}`;

  updateUI();
}

// ================== CONVERT POINTS ==================
async function convertPoints() {
  const res = await fetch("/api/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

function openRoadmap() {
  window.location.href = "/roadmap.html";
}

// ================== MARKET ==================
async function buyToken(amount = 1) {
  const res = await fetch("/api/market/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID, amount })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  tokens = data.tokens;
  updateUI();
}

async function sellToken(amount = 1) {
  const res = await fetch("/api/market/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID, amount })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  tokens = data.tokens;
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
  if (data.error) return alert(data.error);

  balance = data.balance;
  energy = data.energy;
  updateUI();
}

// ================== REFERRAL ==================
function copyRef() {
  navigator.clipboard.writeText(
    document.getElementById("refLink").value
  );
  alert("✅ Referral link copied");
}

// ================== TASKS ==================
function joinYouTube() {
  tg.openLink("https://youtube.com/@Sunusicrypto");

  setTimeout(async () => {
    const res = await fetch("/api/task/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (!data.error) {
      tokens = data.tokens;
      updateUI();
      alert("🎉 +10 TOKEN");
    }
  }, 4000);
}

function joinGroup() {
  tg.openLink("https://t.me/tele_tap_ai");

  setTimeout(async () => {
    const res = await fetch("/api/task/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (!data.error) {
      tokens = data.tokens;
      updateUI();
      alert("🎉 +5 TOKEN");
    }
  }, 4000);
}

function joinChannel() {
  tg.openLink("https://t.me/TeleAIupdates");

  setTimeout(async () => {
    const res = await fetch("/api/task/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (!data.error) {
      tokens = data.tokens;
      updateUI();
      alert("🎉 +5 TOKEN");
    }
  }, 4000);
    }

async function upgradePro(level) {
  const res = await fetch("/api/pro/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      level
    })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("proMsg").innerText =
      "❌ " + data.error;
    return;
  }

  tokens = data.tokens;

  document.getElementById("proMsg").innerText =
    `✅ PRO Level ${data.proLevel} activated!`;

  updateUI();
}
