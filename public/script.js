// ===============================
// TELEGRAM WEB APP INIT
// ===============================
const tg = window.Telegram.WebApp;
tg.expand();

// USER ID
let userId = localStorage.getItem("userId");

if (!userId) {
  userId = tg?.initDataUnsafe?.user?.id || Math.floor(Math.random() * 1000000);
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
  // vibration
  if (navigator.vibrate) navigator.vibrate(30);

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
// COPY REF LINK
// ===============================
function copyLink() {
  navigator.clipboard.writeText(
    window.location.origin + "?ref=" + userId
  );
  alert("Invite link copied!");
}

// ===============================
// TASK SYSTEM
// ===============================
function openTask(type) {
  let url = "";

  if (type === "tg") {
    url = "https://t.me/TeleAIupdates";
  }

  if (type === "yt") {
    url = "https://youtube.com/@Sunusicrypto";
  }

  if (type === "chat") {
    url = "https://t.me/tele_tap_ai";
  }

  window.open(url, "_blank");

  setTimeout(() => {
    completeTask(type);
  }, 5000);
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
// DAILY REWARD
// ===============================
async function claimDaily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("dailyMsg").innerText = data.error;
  } else {
    document.getElementById("dailyMsg").innerText =
      "🎁 You got +" + data.reward + " TT";
    document.getElementById("balance").innerText = data.balance;
  }
}

// ===============================
// WITHDRAW
// ===============================
async function withdraw() {
  const wallet = document.getElementById("wallet").value;
  if (!wallet) return alert("Enter wallet address");

  const res = await fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, wallet })
  });

  const data = await res.json();

  document.getElementById("withdrawMsg").innerText =
    data.error || "Withdrawal sent!";
}
