const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const userId =
  localStorage.getItem("uid") || Math.floor(Math.random() * 1000000);
localStorage.setItem("uid", userId);

const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");

// LOAD USER
async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ref })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// TAP
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// COPY REF
function copyLink() {
  const link = `${location.origin}?ref=${userId}`;
  navigator.clipboard.writeText(link);
  alert("Copied!");
}

// DAILY REWARD
async function claimDaily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("dailyMsg").innerText =
    data.error || `🎉 You got +${data.reward}`;
}

// WITHDRAW
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
    data.error || "✅ Withdraw request sent!";
}

// START
loadUser();
