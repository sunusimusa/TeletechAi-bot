const tg = window.Telegram.WebApp;
tg.expand();

let USER_ID = null;

// ================= INIT =================
async function init() {
  const tgUser = tg.initDataUnsafe?.user;

  if (!tgUser) {
    alert("Please reopen the bot");
    return;
  }

  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: tgUser.id,
      initData: tg.initDataUnsafe
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  USER_ID = data.telegramId || data.id;

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
  document.getElementById("level").innerText = data.level;

  setReferralLink();
  loadLeaderboard();
  loadTopRefs();
  loadStats();
}

init();

// ================= TAP =================
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
  document.getElementById("level").innerText = data.level;
}

// ================= DAILY =================
async function daily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  document.getElementById("balance").innerText = data.balance;
  alert("🎁 Daily reward claimed!");
}

async function openBox() {
  const res = await fetch("/open-box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();

  if (data.error) return alert(data.error);

  alert(`🎁 You got ${data.reward} coins!`);
  document.getElementById("balance").innerText = data.balance;
}

async function watchAd() {
  alert("📺 Watching Ad...");

  setTimeout(async () => {
    const res = await fetch("/ads-spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error === "LIMIT_REACHED"
        ? "❌ Ad limit reached today"
        : data.error);
      return;
    }

    document.getElementById("balance").innerText = data.balance;
    document.getElementById("energy").innerText = data.energy;

    document.getElementById("adsInfo").innerText =
      `🎁 You got: ${data.reward} | Spins left: ${data.spinsLeft}`;
  }, 3000); // fake ad delay
}

// ================= TASK =================
function openTask(type) {
  if (type === "youtube") window.open("https://youtube.com/@Sunusicrypto", "_blank");
  if (type === "channel") window.open("https://t.me/TeleAIupdates", "_blank");
  if (type === "group") window.open("https://t.me/tele_tap_ai", "_blank");

  setTimeout(async () => {
    const res = await fetch("/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID, type })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    document.getElementById("balance").innerText = data.balance;
    alert("✅ Task completed!");
  }, 3000);
}

// ================= REFERRAL =================
function setReferralLink() {
  document.getElementById("refLink").value =
    `https://t.me/TeletechAi_bot?start=${USER_ID}`;
}

function copyInvite() {
  const input = document.getElementById("refLink");
  input.select();
  document.execCommand("copy");
  alert("Invite link copied!");
}

// ================= LEADERBOARD =================
function loadLeaderboard() {
  fetch("/leaderboard")
    .then(res => res.json())
    .then(data => {
      document.getElementById("board").innerHTML =
        data.map((u, i) => `#${i + 1} — ${u.balance} coins`).join("<br>");
    });
}

// ================= TOP REFERRALS =================
function loadTopRefs() {
  fetch("/top-referrals")
    .then(res => res.json())
    .then(data => {
      let html = "";
      data.forEach((u, i) => {
        html += `
          <div class="rank-row">
            <span>#${i + 1}</span>
            <span>${u.telegramId}</span>
            <span>${u.referrals} 👥</span>
          </div>
        `;
      });
      document.getElementById("topRefs").innerHTML = html;
    });
}

function openRoadmap() {
  alert(`
🚀 TELE TECH AI ROADMAP

PHASE 1 (LIVE):
✔ Tap to Earn
✔ Referral System
✔ Daily Rewards
✔ Leaderboard

PHASE 2 (COMING SOON):
🔜 Convert to Token
🔜 Referral Levels
🔜 Energy Boost

PHASE 3:
🔜 Withdraw (USDT / TON)
🔜 NFT Rewards

PHASE 4:
🔜 Airdrop
🔜 Mobile App
🔜 Community DAO
`);
}

function openAd() {
  alert("🚀 Sponsored Ad\nComing soon...");
  // window.open("https://example.com", "_blank");
}

// ROTATING ADS
const ads = [
  "https://i.imgur.com/3ZQ3Z6Y.png",
  "https://i.imgur.com/9QZ6J1K.png",
  "https://i.imgur.com/5WvKxYF.png"
];

let adIndex = 0;

setInterval(() => {
  const img = document.getElementById("adImage");
  if (img) {
    img.src = ads[adIndex];
    adIndex = (adIndex + 1) % ads.length;
  }
}, 5000);

// ================= STATS =================
function loadStats() {
  fetch("/stats")
    .then(res => res.json())
    .then(data => {
      document.getElementById("totalUsers").innerText = data.total;
    });
}

function loadTeamRanking() {
  fetch("/team-leaderboard")
    .then(res => res.json())
    .then(data => {
      let html = "";

      data.forEach((team, index) => {
        html += `
          <div class="team-row">
            <span>#${index + 1} ${team.name}</span>
            <span>🔥 ${team.totalScore}</span>
          </div>
        `;
      });

      document.getElementById("teamBoard").innerHTML = html;
    });
}

function openMenu() {
  document.getElementById("sideMenu").style.left = "0";
}

function closeMenu() {
  document.getElementById("sideMenu").style.left = "-260px";
}

function openPage(page) {
  closeMenu();

  if (page === "spin") {
    alert("🎰 Spin page");
  }
  if (page === "leaderboard") {
    alert("🏆 Leaderboard");
  }
}

function openFullPage() {
  document.getElementById("fullPage").style.display = "flex";
}

function closeFullPage() {
  document.getElementById("fullPage").style.display = "none";
}

function spin() {
  const rewards = ["10 Coins", "20 Coins", "50 Coins", "Try Again"];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  document.getElementById("spinResult").innerText = "🎉 You got: " + reward;
}

function tap() {
  document.getElementById("tapResult").innerText = "🔥 +1 Coin!";
}

function openBox() {
  alert("🎁 You opened a box and got 20 coins!");
}

function spin() {
  const rewards = ["10 Coins", "20 Coins", "Nothing 😅", "50 Coins"];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  alert("🎰 You won: " + reward);
}

function openPage(page) {
  alert("Opening: " + page);
}

let balance = 0;
let energy = 100;
let level = 1;

function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText = energy;
  document.getElementById("level").innerText = level;

  document.getElementById("energyFill").style.width =
    Math.max(0, energy) + "%";
}

function tap() {
  if (energy <= 0) {
    document.getElementById("tapResult").innerText = "⚡ No Energy!";
    return;
  }

  energy -= 1;
  balance += 1;

  if (balance % 50 === 0) {
    level += 1;
  }

  document.getElementById("tapResult").innerText = "🔥 +1 Coin!";
  updateUI();
}

document.addEventListener("DOMContentLoaded", () => {
  updateUI();
});

loadTeamRanking();
