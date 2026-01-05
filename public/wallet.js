const tg = Telegram.WebApp;
tg.expand();

const TELEGRAM_ID = tg.initDataUnsafe.user.id;

// ================= WALLET =================
async function loadWallet() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  const addr = data.walletAddress;
  document.getElementById("walletAddr").innerText = addr;
  document.getElementById("walletTokens").innerText =
    data.tokens ?? 0;

  document.getElementById("qrImg").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${addr}`;
}

// ================= COPY =================
function copyWallet() {
  const text =
    document.getElementById("walletAddr").innerText;
  navigator.clipboard.writeText(text);
  alert("✅ Wallet copied");
}

// ================= SEND / RECEIVE UI =================
function openSend() {
  document.getElementById("sendBox")
    ?.classList.remove("hidden");
  document.getElementById("receiveBox")
    ?.classList.add("hidden");
}

function openReceive() {
  document.getElementById("receiveBox")
    ?.classList.remove("hidden");
  document.getElementById("sendBox")
    ?.classList.add("hidden");
}

// ================= SEND TOKEN =================
async function sendToken() {
  const toWallet =
    document.getElementById("toWallet").value.trim();
  const amount =
    Number(document.getElementById("amount").value);

  if (!toWallet || amount <= 0) {
    alert("❌ Invalid data");
    return;
  }

  const res = await fetch("/api/wallet/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId: TELEGRAM_ID,
      toWallet,
      amount
    })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  alert(
    `✅ Sent ${data.sent} TOKEN\n⛽ Gas Fee: ${data.gasFee}`
  );

  loadWallet();
  loadHistory();
}

// ================= TRANSACTION HISTORY =================
async function loadHistory() {
  const res = await fetch("/api/wallet/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId: TELEGRAM_ID })
  });

  const data = await res.json();

  const list = document.getElementById("txList");
  list.innerHTML = "";

  if (data.error) {
    list.innerText =
      data.error.replaceAll("_", " ");
    return;
  }

  if (data.history.length === 0) {
    list.innerHTML = "<p>No transactions yet</p>";
    return;
  }

  data.history.forEach(tx => {
    const type =
      tx.fromWallet === data.wallet
        ? "Sent"
        : "Received";

    const row = document.createElement("div");
    row.className = `tx-item ${type.toLowerCase()}`;

    row.innerHTML = `
      <div>
        <b>${type}</b> ${tx.amount} TOKEN
        <br/>
        <small>Gas: ${tx.gasFee}</small>
      </div>
      <div class="tx-date">
        ${new Date(tx.createdAt).toLocaleString()}
      </div>
    `;

    list.appendChild(row);
  });
}

// ================= NAV =================
function goBack() {
  window.history.back();
}

// ================= INIT =================
loadWallet();
loadHistory();
