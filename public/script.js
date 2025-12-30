const tg = window.Telegram.WebApp;
tg.expand();

let USER_ID = null;

// ================= INIT =================
async function init() {
  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return alert("Please reopen the bot");

  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: tgUser.id,
      initData: tg.initDataUnsafe
    })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

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

// ================= TAP (MAIN FIX) =================
function tap() {
  const btn = document.querySelector(".tap-btn");

  // Animation
  btn.classList.add("tap-animate");
  setTimeout(() => btn.classList.remove("tap-animate"), 120);

  // Prevent tapping if energy empty
  if (energy <= 0) {
    document.getElementById("tapResult").innerText = "⚡ No Energy!";
    return;
  }

  // Update values
  energy -= 1;
  balance += 1;

  document.getElementById("energy").innerText = energy;
  document.getElementById("balance").innerText = balance;

  // Energy bar
  document.getElementById("energyFill").style.width = energy + "%";

  // Feedback text
  document.getElementById("tapResult").innerText = "🔥 +1 Coin!";
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

// ================= OPEN BOX =================
async function openBox() {
  const res = await fetch("/open-box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  document.getElementById("balance").innerText = data.balance;
  alert(`🎁 You got ${data.reward} coins!`);
}

// ================= WATCH AD =================
async function watchAd() {
  alert("📺 Watching Ad...");

  setTimeout(async () => {
    const res = await fetch("/ads-spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    document.getElementById("balance").innerText = data.balance;
    document.getElementById("energy").innerText = data.energy;
  }, 3000);
}

// ================= TASK =================
function openTask(type) {
  if (type === "youtube") window.open("https://youtube.com/@Sunusicrypto");
  if (type === "channel") window.open("https://t.me/TeleAIupdates");
  if (type === "group") window.open("https://t.me/tele_tap_ai");

  setTimeout(async () => {
    const res = await fetch("/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID, type })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    document.getElementById("balance").innerText = data.balance;
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

function loadTopRefs() {
  fetch("/top-referrals")
    .then(res => res.json())
    .then(data => {
      document.getElementById("topRefs").innerHTML =
        data.map((u, i) =>
          `<div>#${i + 1} ${u.telegramId} (${u.referrals})</div>`
        ).join("");
    });
}

// ================= STATS =================
function loadStats() {
  fetch("/stats")
    .then(res => res.json())
    .then(data => {
      document.getElementById("totalUsers").innerText = data.total;
    });
}

// ================= MENU =================
function openMenu() {
  document.getElementById("sideMenu").style.left = "0";
}

function closeMenu() {
  document.getElementById("sideMenu").style.left = "-260px";
}

function openRoadmap() {
  alert(`
🚀 TELE TECH AI ROADMAP

PHASE 1 ✅
- Tap to Earn
- Referral System
- Daily Reward

PHASE 2 🔜
- Convert to Token
- Energy Boost
- Spin Rewards

PHASE 3 🔜
- Withdraw
- NFT Rewards

PHASE 4 🔜
- Airdrop
- Mobile App
  `);
}
