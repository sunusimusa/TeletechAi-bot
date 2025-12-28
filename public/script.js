const tg = window.Telegram.WebApp;
tg.expand();

let userId = null;
let balance = 0;
let energy = 0;

async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData: tg.initDataUnsafe })
  });

  const data = await res.json();

  if (!data || data.error) {
    alert("Failed to load user");
    return;
  }

  userId = data.id;
  balance = data.balance ?? 0;
  energy = data.energy ?? 0;

  updateUI();
  loadBoard();
  setReferral();
}

function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("energy").innerText = energy;

  const percent = Math.min(100, energy);
  document.getElementById("energyFill").style.width = percent + "%";
}

async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  energy = data.energy;
  updateUI();
}

async function daily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  updateUI();
}

function setReferral() {
  document.getElementById("refLink").value =
    `https://t.me/teletechaibot?start=${userId}`;
}

async function loadBoard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  document.getElementById("board").innerHTML =
    data.map(u => `🏆 ${u.id} — ${u.balance}`).join("<br>");
}
document.getElementById("token").innerText = data.token || 0;

function copyInvite() {
  const el = document.getElementById("refLink");
  el.select();
  document.execCommand("copy");
  alert("Copied!");
}

async function convertToken() {
  const res = await fetch("/convert", {
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
  document.getElementById("token").innerText = data.token;

  alert("✅ Token converted!");
}

init();
