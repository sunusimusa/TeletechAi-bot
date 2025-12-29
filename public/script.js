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

// ================= STATS =================
function loadStats() {
  fetch("/stats")
    .then(res => res.json())
    .then(data => {
      document.getElementById("totalUsers").innerText = data.total;
    });
}
