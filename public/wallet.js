/* ================= WALLET PAGE ================= */

let walletBalance = parseInt(localStorage.getItem("tokens")) || 0;

const balanceEl = document.getElementById("walletBalance");
const sendBtn = document.getElementById("sendBtn");
const msgEl = document.getElementById("walletMsg");

function updateWalletUI() {
  balanceEl.textContent = walletBalance + " TTECH";
}

updateWalletUI();

sendBtn.addEventListener("click", () => {
  const to = document.getElementById("toAddress").value.trim();
  const amount = parseInt(document.getElementById("sendAmount").value);

  if (!to || !amount || amount <= 0) {
    msgEl.textContent = "❌ Enter valid address & amount";
    return;
  }

  if (amount > walletBalance) {
    msgEl.textContent = "❌ Insufficient balance";
    return;
  }

  // simulate transfer
  walletBalance -= amount;
  localStorage.setItem("tokens", walletBalance);

  updateWalletUI();

  msgEl.textContent = "✅ Transfer successful";

  document.getElementById("toAddress").value = "";
  document.getElementById("sendAmount").value = "";
});

function goBack() {
  window.location.href = "/";
}
