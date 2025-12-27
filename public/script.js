// ===============================
// TELEGRAM INIT
// ===============================
const tg = window.Telegram.WebApp;
tg.expand();

// ===============================
// TON CONNECT
// ===============================
const tonConnect = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://your-domain.com/tonconnect-manifest.json"
});

// ===============================
// USER INIT
// ===============================
let userId = localStorage.getItem("userId");

if (!userId) {
  userId = tg?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 1e9);
  localStorage.setItem("userId", userId);
}

// REF PARAM
const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");

// ===============================
// LOAD USER
// ===============================
async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ref })
  });

  const data = await res.json();

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  document.getElementById("refLink").value =
    window.location.origin + "?ref=" + userId;
}

loadUser();

// ===============================
// TAP SYSTEM
// ===============================
async function tap() {
  if (navigator.vibrate) navigator.vibrate(40);

  const btn = document.getElementById("tap");
  btn.style.transform = "scale(0.9)";
  setTimeout(() => (btn.style.transform = "scale(1)"), 100);

  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.error) return;

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// ===============================
// DAILY REWARD
// ===============================
async function claimDaily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  document.getElementById("dailyMsg").innerText =
    data.error || `🎁 You got ${data.reward} TT`;

  if (!data.error) {
    document.getElementById("balance").innerText = data.balance;
  }
}

// ===============================
// TASK SYSTEM
// ===============================
function openTask(type) {
  let url = "";

  if (type === "tg") url = "https://t.me/TeleAIupdates";
  if (type === "yt") url = "https://youtube.com/@Sunusicrypto";
  if (type === "chat") url = "https://t.me/tele_tap_ai";

  window.open(url, "_blank");

  setTimeout(() => completeTask(type), 5000);
}

async function completeTask(type) {
  const res = await fetch("/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("taskMsg").innerText = data.error;
  } else {
    document.getElementById("taskMsg").innerText = "✅ Task completed!";
    document.getElementById("balance").innerText = data.balance;
  }
}

// ===============================
// WALLET CONNECT
// ===============================
document.getElementById("connectWalletBtn")?.addEventListener("click", async () => {
  const wallet = await tonConnect.connectWallet();

  if (wallet) {
    document.getElementById("walletAddress").innerText =
      wallet.account.address;

    await saveWallet(wallet.account.address);
  }
});

async function saveWallet(address) {
  await fetch("/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, address })
  });
}

async function withdraw() {
  const amount = prompt("Enter amount to withdraw:");

  if (!amount || amount <= 0) return;

  const res = await fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("withdrawMsg").innerText = data.error;
  } else {
    document.getElementById("withdrawMsg").innerText =
      "✅ Withdraw request sent. Waiting for admin approval.";
  }
}

// ===============================
// COPY REF LINK
// ===============================
function copyLink() {
  navigator.clipboard.writeText(
    window.location.origin + "?ref=" + userId
  );
  alert("Invite link copied!");
  }
