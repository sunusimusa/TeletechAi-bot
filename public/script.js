const tg = window.Telegram.WebApp;
tg.expand();

const USER_ID = tg?.initDataUnsafe?.user?.id;

let balance = 0;
let energy = 0;
let level = 1;

async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  });

  const data = await res.json();
  balance = data.balance;
  energy = data.energy;
  level = data.level;

  updateUI();
}
init();

function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText = energy;
  document.getElementById("level").innerText = level;
}

// TAP
function tap() {
  fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) return alert(d.error);
    balance = d.balance;
    energy = d.energy;
    level = d.level;
    updateUI();
  });
}

// DAILY
function daily() {
  fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) return alert(d.error);
    balance = d.balance;
    updateUI();
    alert("🎁 Daily claimed!");
  });
}

// OPEN BOX
function openBox() {
  fetch("/open-box", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) return alert(d.error);
    alert("🎁 You got " + d.reward);
    balance = d.balance;
    updateUI();
  });
}

// SPIN
function spin() {
  fetch("/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) return alert(d.error);
    alert("🎉 " + d.reward);
    balance = d.balance;
    energy = d.energy;
    updateUI();
  });
        }

// ================= TASK BUTTONS =================
function openTask(type) {
  if (type === "youtube") {
    window.open("https://youtube.com/@Sunusicrypto", "_blank");
  }

  if (type === "channel") {
    window.open("https://t.me/TeleAIupdates", "_blank");
  }

  if (type === "group") {
    window.open("https://t.me/tele_tap_ai", "_blank");
  }

  // give reward after delay
  setTimeout(async () => {
    const res = await fetch("/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: USER_ID,
        type: type
      })
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    balance = data.balance;
    updateUI();
    alert("✅ Task completed!");
  }, 3000);
}

// ================= COPY INVITE =================
function copyInvite() {
  const link = `https://t.me/TeletechAi_bot?start=${USER_ID}`;
  navigator.clipboard.writeText(link);
  alert("✅ Invite link copied!");
}
setReferralLink();

// ================= ROADMAP =================
function openRoadmap() {
  alert(`🚀 TELE TECH AI ROADMAP

PHASE 1 ✅
• Tap
• Daily Reward
• Referral

PHASE 2 🔜
• Token
• Energy Boost
• Spin

PHASE 3 🔜
• Withdraw
• NFT

PHASE 4 🔜
• Airdrop
• Mobile App`);
}

// ================= WHITEPAPER =================
function openWhitepaper() {
  window.open("/whitepaper.html", "_blank");
}
