const tg = window.Telegram.WebApp;
tg.expand();

let userId = null;

// INIT USER
async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      initData: tg.initDataUnsafe
      updateEnergyBar();
    })
  });

  const data = await res.json();

  userId = data.id;
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;

  setReferral();
  loadBoard();
}

init();

// TAP
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    updateEnergyBar();
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// DAILY
async function daily() {
  const res = await fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  alert(data.error || "Daily reward claimed!");
  document.getElementById("balance").innerText = data.balance;
}

// REF LINK
function setReferral() {
  document.getElementById("refLink").value =
    `https://t.me/teletechaibot?start=${userId}`;
}

// COPY
function copyInvite() {
  const input = document.getElementById("refLink");
  input.select();
  document.execCommand("copy");
  alert("Copied!");
}

// LEADERBOARD
async function loadBoard() {
  const res = await fetch("/leaderboard");
  const data = await res.json();

  document.getElementById("board").innerHTML =
    data.map(u => `🏆 ${u.id} — ${u.balance}`).join("<br>");
}

function updateEnergyBar() {
  const percent = (energy / 100) * 100;
  document.getElementById("energyFill").style.width = percent + "%";
}
