/* =====================================================
   WALLET – BROWSER ONLY (CLEAN)
===================================================== */

let tokens = Number(localStorage.getItem("tokens")) || 0;
let wallet = localStorage.getItem("wallet");

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (!wallet) {
    wallet = "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("wallet", wallet);
  }

  updateWalletUI();
});

/* =====================================================
   UI UPDATE
===================================================== */
function updateWalletUI() {
  const bal = document.getElementById("walletBalance");
  if (bal) {
    bal.innerText = tokens + " TTECH";
  }
}

/* =====================================================
   SEND TOKEN (DEMO)
===================================================== */
function sendToken() {
  const to = document.getElementById("toAddress").value.trim();
  const amount = Number(document.getElementById("sendAmount").value);
  const msg = document.getElementById("walletMsg");

  if (!to || !amount || amount <= 0) {
    msg.innerText = "❌ Invalid input";
    return;
  }

  if (amount > tokens) {
    msg.innerText = "❌ Not enough tokens";
    return;
  }

  // DEMO TRANSFER
  tokens -= amount;
  localStorage.setItem("tokens", tokens);

  msg.innerText = `✅ Sent ${amount} TTECH`;
  document.getElementById("toAddress").value = "";
  document.getElementById("sendAmount").value = "";

  updateWalletUI();
}

/* =====================================================
   NAVIGATION
===================================================== */
function goBack() {
  window.location.href = "/";
}
