/* ================= INIT DATA ================= */
let wallet = localStorage.getItem("wallet") || "TTECH-" + Math.random().toString(36).slice(2,8).toUpperCase();
let balance = parseInt(localStorage.getItem("balance") || "23500");
let tokens = parseInt(localStorage.getItem("tokens") || "28");
let historyList = JSON.parse(localStorage.getItem("history") || "[]");

localStorage.setItem("wallet", wallet);

/* ================= UI ================= */
function updateUI() {
  document.getElementById("walletAddress").textContent = wallet;
  document.getElementById("balance").textContent = balance;
  document.getElementById("tokens").textContent = tokens;

  const list = document.getElementById("history");
  list.innerHTML = "";

  historyList.slice().reverse().forEach(tx => {
    const li = document.createElement("li");
    li.textContent = tx;
    list.appendChild(li);
  });
}

/* ================= COPY ================= */
function copyWallet() {
  navigator.clipboard.writeText(wallet);
  alert("✅ Wallet copied");
}

/* ================= SEND ================= */
function sendToken() {
  const to = document.getElementById("toWallet").value.trim();
  const amount = parseInt(document.getElementById("sendAmount").value);

  if (!to || !amount || amount <= 0) {
    return showMsg("❌ Invalid data");
  }

  if (amount > tokens) {
    return showMsg("❌ Not enough tokens");
  }

  tokens -= amount;
  historyList.push(`Sent ${amount} TOKEN to ${to}`);

  save();
  updateUI();
  showMsg("✅ Transaction sent");
}

/* ================= UTILS ================= */
function showMsg(msg) {
  document.getElementById("sendMsg").textContent = msg;
}

function save() {
  localStorage.setItem("tokens", tokens);
  localStorage.setItem("history", JSON.stringify(historyList));
}

updateUI();
