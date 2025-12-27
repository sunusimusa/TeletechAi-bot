const tg = window.Telegram.WebApp;
tg.expand();

const initData = tg.initData;
let userId = null;

async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData })
  });

  const data = await res.json();
  userId = data.id;

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  loadLeaderboard();
  loadReferrals();
}

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

async function claimDaily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  alert(data.error || "Daily claimed!");
}

async function loadLeaderboard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  document.getElementById("topUsers").innerHTML =
    data.map((u, i) => `🏆 ${i + 1}. ${u.id} — ${u.balance}`).join("<br>");
}

async function loadReferrals() {
  const res = await fetch("/referrals");
  const data = await res.json();

  document.getElementById("topReferrals").innerHTML =
    data.map((u, i) => `👤 ${i + 1}. ${u.id} — ${u.refs}`).join("<br>");
}

init();
