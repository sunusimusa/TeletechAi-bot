const userId = "1248500925"; // TELEGRAM USER ID
const balanceEl = document.getElementById("balance");
const withdrawBtn = document.getElementById("withdrawBtn");

/* INIT */
async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const data = await res.json();
  updateBalance(data.balance);
}

/* TAP */
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  const data = await res.json();
  if (data.balance !== undefined) {
    updateBalance(data.balance);
  }
}

/* WITHDRAW */
async function withdraw() {
  const wallet = prompt("Enter your USDT TRC20 wallet:");
  if (!wallet) return;

  const res = await fetch("/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, wallet }),
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error);
  } else {
    alert("Withdraw request sent!");
    updateBalance(0);
  }
}
function updateBalance(amount) {
  document.getElementById("balance").innerText = amount;

  if (amount >= 1000) {
    document.getElementById("withdrawBtn").style.display = "block";
  }
}

/* UPDATE UI */
function updateBalance(balance) {
  balanceEl.innerText = balance + " TT";
  withdrawBtn.style.display = balance >= 1000 ? "block" : "none";
}

init();
