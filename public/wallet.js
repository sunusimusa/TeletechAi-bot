const USER_ID = localStorage.getItem("userId") || "SUNUSI_001";

async function initWallet() {
  const res = await fetch(`/api/wallet/${USER_ID}`);
  const data = await res.json();

  if (!data.success) return;

  document.getElementById("walletAddress").innerText = data.wallet;
  document.getElementById("walletTokens").innerText = data.tokens;

  generateQR(data.wallet);
  loadHistory(data.wallet);
}

async function sendToken() {
  const to = document.getElementById("toAddress").value.trim();
  const amount = Number(document.getElementById("sendAmount").value);
  const msg = document.getElementById("walletMsg");

  if (!to || amount <= 0) {
    msg.innerText = "❌ Invalid input";
    return;
  }

  const res = await fetch("/api/wallet/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, to, amount })
  });

  const data = await res.json();

  if (!data.success) {
    msg.innerText = "❌ " + data.message;
    return;
  }

  msg.innerText = "✅ Transfer successful";
  document.getElementById("walletTokens").innerText = data.tokens;

  document.getElementById("toAddress").value = "";
  document.getElementById("sendAmount").value = "";
}

async function loadHistory(wallet) {
  const res = await fetch(`/api/wallet/history/${wallet}`);
  const data = await res.json();

  const box = document.getElementById("txHistory");
  if (!data.success || data.txs.length === 0) {
    box.innerText = "No transactions yet";
    return;
  }

  box.innerHTML = data.txs
    .map(
      tx =>
        `• ${tx.type.toUpperCase()} ${tx.amount} → ${
          tx.to === wallet ? "You" : tx.to
        }`
    )
    .join("<br>");
}

function generateQR(text) {
  document.getElementById("qrImage").src =
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
    encodeURIComponent(text);
}

function copyWallet() {
  navigator.clipboard.writeText(
    document.getElementById("walletAddress").innerText
  );
  alert("Wallet copied");
}

document.addEventListener("DOMContentLoaded", initWallet);
