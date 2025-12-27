const tg = window.Telegram.WebApp;
tg.expand();

let tonConnectUI = null;
let userId = null;
let userReady = false;

// Load user
async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initData: tg.initDataUnsafe
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  userId = data.id;
  userReady = true;

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  setReferralLink();
  loadLeaderboard();
  loadReferrals();
}

loadUser();

// TAP
async function tap() {
  if (!userReady) return alert("Please wait...");

  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// DAILY
async function claimDaily() {
  if (!userReady) return alert("Please wait...");

  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  document.getElementById("balance").innerText = data.balance;
}

// REFERRAL LINK
function setReferralLink() {
  const link = `https://t.me/YOUR_BOT_USERNAME?start=${userId}`;
  document.getElementById("refLink").value = link;
}

// LEADERBOARD
async function loadLeaderboard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  document.getElementById("topUsers").innerHTML =
    data.map((u, i) => `🏆 ${i + 1}. ${u.id} — ${u.balance}`).join("<br>");
}

function openTask(type) {
  if (!userId) return alert("Please wait...");

  let url = "";

  if (type === "tg") url = "https://t.me/TeleAIupdates";
  if (type === "yt") url = "https://youtube.com/@Sunusicrypto";
  if (type === "chat") url = "https://t.me/tele_tap_ai";

  window.open(url, "_blank");

  setTimeout(() => completeTask(type), 3000);
}

async function completeTask(type) {
  const res = await fetch("/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type }),
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
  } else {
    alert("✅ Task completed! +10");
    document.getElementById("balance").innerText = data.balance;
  }
}

function copyInvite() {
  const input = document.getElementById("refLink");
  input.select();
  input.setSelectionRange(0, 99999); // mobile support

  navigator.clipboard.writeText(input.value)
    .then(() => alert("Invite link copied ✅"))
    .catch(() => alert("Failed to copy"));
}

// REFERRALS
async function loadReferrals() {
  const res = await fetch("/referrals");
  const data = await res.json();

  document.getElementById("topReferrals").innerHTML =
    data.map((u, i) => `👤 ${i + 1}. ${u.id} — ${u.refs}`).join("<br>");
}


let tonConnectUI;

function initTon() {
  tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: "https://teletechai-bot.onrender.com/tonconnect-manifest.json",
  });
}

initTon();

async function connectWallet() {
  try {
    const wallet = await tonConnectUI.connectWallet();

    document.getElementById("walletAddress").value = wallet.account.address;

    await fetch("/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        address: wallet.account.address
      })
    });

    alert("Wallet connected successfully ✅");
  } catch (e) {
    console.log(e);
    alert("Wallet connection cancelled");
  }
}

// WALLET
async function connectWallet() {
  const tonConnect = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: window.location.origin + "/tonconnect-manifest.json"
  });

  const wallet = await tonConnect.connectWallet();
  document.getElementById("walletAddress").innerText = wallet.account.address;

  await fetch("/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      address: wallet.account.address
    })
  });
}
