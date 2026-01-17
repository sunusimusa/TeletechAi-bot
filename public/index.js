let USER = null;
let opening = false;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    USER = await res.json();
    if (!USER.success) throw 1;

    updateUI();

  } catch {
    alert("User init failed");
  }
}

function updateUI() {
  document.getElementById("balance").innerText =
    "Balance: " + USER.balance;
  document.getElementById("energy").innerText =
    "Energy: " + USER.energy;
}

async function watchAd() {
  const res = await fetch("/api/ads/watch", {
    method: "POST",
    credentials: "include"
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  USER.energy = data.energy;
  updateUI();
}

async function openBox(box) {
  if (opening) return;
  opening = true;

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    USER.balance = data.balance;
    USER.energy = data.energy;

    animateBox(box, data.reward);
    setTimeout(updateUI, 600);

  } finally {
    opening = false;
  }
}
