const tg = window.Telegram.WebApp;
tg.expand();

// TELEGRAM USER ID
const userId = tg.initDataUnsafe?.user?.id || "demo-user";

// ELEMENTS
const balanceEl = document.getElementById("balance");
const withdrawBtn = document.getElementById("withdrawBtn");

// INIT
async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });
  const data = await res.json();
  updateBalance(data.balance);
}

// TAP
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.balance !== undefined) {
    updateBalance(data.balance);
  }
}

// UPDATE BALANCE
function updateBalance(amount) {
  balanceEl.innerText = amount + " TT";

  if (amount >= 1000) {
    withdrawBtn.style.display = "block";
  } else {
    withdrawBtn.style.display = "none";
  }
}

// WITHDRAW
async function withdraw() {
  const wallet = prompt("Enter your USDT TRC20 wallet:");
  if (!wallet) return;

  const res = await fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, wallet })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
  } else {
    alert("Withdraw request sent!");
    updateBalance(0);
  }
}

init();
