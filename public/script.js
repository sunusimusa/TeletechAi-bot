let userId = "guest";

// 👉 KARBAR ID DAGA TELEGRAM
if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe?.user) {
  userId = Telegram.WebApp.initDataUnsafe.user.id.toString();
}

const balanceEl = document.getElementById("balance");
const withdrawBtn = document.getElementById("withdrawBtn");

// INIT
fetch("/start", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId })
})
  .then(r => r.json())
  .then(d => updateBalance(d.balance));

// TAP
function tap() {
  fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  })
    .then(r => r.json())
    .then(d => {
      if (d.balance !== undefined) updateBalance(d.balance);
    });
}

// UPDATE BALANCE
function updateBalance(amount) {
  balanceEl.innerText = amount + " TT";
  if (amount >= 1000) {
    withdrawBtn.style.display = "block";
  }
}

// WITHDRAW
function withdraw() {
  const wallet = prompt("Enter your USDT TRC20 wallet:");
  if (!wallet) return;

  fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, wallet })
  })
    .then(r => r.json())
    .then(() => {
      alert("Withdraw sent!");
      updateBalance(0);
    });
}
