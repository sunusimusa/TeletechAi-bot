const tg = window.Telegram.WebApp;
tg.expand();

// USER ID
let userId = tg?.initDataUnsafe?.user?.id;

if (!userId) {
  userId = localStorage.getItem("userId");
}

if (!userId) {
  userId = Math.floor(Math.random() * 1000000000);
  localStorage.setItem("userId", userId);
}

// LOAD USER
async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

loadUser();

// TAP
async function tap() {
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
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  alert(data.error || "Reward claimed!");
  if (!data.error) {
    document.getElementById("balance").innerText = data.balance;
  }
}

async function loadLeaderboard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  let html = "";
  data.forEach((u, i) => {
    html += `<p>${i + 1}. ${u.userId} — ${u.balance} TT</p>`;
  });

  document.getElementById("leaderboard").innerHTML = html;
}

async function loadReferrals() {
  const res = await fetch("/referrals");
  const data = await res.json();

  let html = "";
  const medals = ["🥇", "🥈", "🥉"];

  data.forEach((u, i) => {
    html += `<p>${medals[i]} ${u.userId} — ${u.refs} referrals</p>`;
  });

  document.getElementById("refList").innerHTML = html;
}

async function loadLeaderboard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  let html = "";
  data.forEach((u, i) => {
    html += `<div>🏆 ${i + 1}. ${u.userId} — ${u.balance}</div>`;
  });

  document.getElementById("topUsers").innerHTML = html;
}

async function loadReferrals() {
  const res = await fetch("/referrals");
  const data = await res.json();

  let html = "";
  data.forEach((u, i) => {
    html += `<div>👤 ${i + 1}. ${u.userId} — ${u.refs} refs</div>`;
  });

  document.getElementById("topReferrals").innerHTML = html;
}

loadLeaderboard();
loadReferrals();
