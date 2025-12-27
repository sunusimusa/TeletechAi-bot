// ================= TELEGRAM INIT =================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// ================= TON CONNECT =================
const tonConnect = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://teletechai-bot.onrender.com/tonconnect-manifest.json"
});

// ================= USER ID =================
let userId = localStorage.getItem("userId");

if (!userId) {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    userId = window.Telegram.WebApp.initDataUnsafe.user.id;
  } else {
    userId = "web_" + Math.floor(Math.random() * 1000000000);
  }
  localStorage.setItem("userId", userId);
}

// ================= REF =================
const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");

// ================= LOAD USER =================
async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ref })
  });

  const data = await res.json();

  if (!data || !data.balance) {
    console.log("User not ready yet");
    return;
  }

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  document.getElementById("refLink").value =
    window.location.origin + "?ref=" + userId;
}

// ================= TAP =================
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// ================= DAILY =================
async function claimDaily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  document.getElementById("dailyMsg").innerText =
    data.error || `🎁 +${data.reward}`;

  if (!data.error)
    document.getElementById("balance").innerText = data.balance;
}

// ================= TASKS =================
function openTask(type) {
  if (type === "tg") window.open("https://t.me/TeleAIupdates");
  if (type === "yt") window.open("https://youtube.com/@Sunusicrypto");
  if (type === "chat") window.open("https://t.me/tele_tap_ai");

  setTimeout(() => completeTask(type), 4000);
}

async function completeTask(type) {
  const res = await fetch("/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type })
  });

  const data = await res.json();
  document.getElementById("taskMsg").innerText =
    data.error || "✅ Task completed!";
  if (!data.error) {
    document.getElementById("balance").innerText = data.balance;
  }
}

// ================= CONNECT WALLET =================
document.getElementById("connectWalletBtn").onclick = async () => {
  try {
    const wallet = await tonConnect.connectWallet();
    if (!wallet) return;

    document.getElementById("walletAddress").innerText =
      wallet.account.address;

    await fetch("/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        address: wallet.account.address
      })
    });
  } catch (e) {
    alert("Wallet connection failed");
  }
};

// ================= WITHDRAW =================
async function withdraw() {
  const amount = document.getElementById("wallet").value;

  const res = await fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount })
  });

  const data = await res.json();
  document.getElementById("withdrawMsg").innerText =
    data.error || "Withdrawal sent!";
  }

function copyLink() {
  navigator.clipboard.writeText(
    window.location.origin + "?ref=" + userId
  );
  alert("Invite link copied!");
}

loadUser();
