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
