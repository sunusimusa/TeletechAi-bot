const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user;
const userId = user.id;

// get ref id
const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");

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

document.getElementById("refLink").value =
  `https://t.me/YOUR_BOT_USERNAME?start=${userId}`;

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
      `🎉 You got +${data.reward} TT!`;
    document.getElementById("balance").innerText = data.balance;
  }
}
async function withdraw() {
  const wallet = document.getElementById("wallet").value;

  if (!wallet) {
    alert("Enter wallet address");
    return;
  }

  const res = await fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, wallet })
  });

  const data = await res.json();

  if (data.error) {
    document.getElementById("withdrawMsg").innerText = data.error;
  } else {
    document.getElementById("withdrawMsg").innerText =
      "✅ Withdraw request sent!";
    document.getElementById("balance").innerText = "0 TT";
  }
}

loadUser();
