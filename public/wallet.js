// ================= TELEGRAM =================
const tg = window.Telegram?.WebApp;
tg?.expand();

const TELEGRAM_ID =
  tg?.initDataUnsafe?.user?.id || null;

if (!TELEGRAM_ID) {
  alert("❌ Telegram ID not found");
}

// ================= CONFIG =================
const GAS_FEE = 1; // ⛽ 1 TOKEN gas
let pendingTx = null;

// ================= WALLET =================
async function loadWallet() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: TELEGRAM_ID })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    const addr = data.walletAddress;

    document.getElementById("walletAddr").innerText = addr;
    document.getElementById("walletTokens").innerText =
      data.tokens ?? 0;

    document.getElementById("qrImg").src =
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${addr}`;

  } catch (e) {
    alert("❌ Failed to load wallet");
    console.error(e);
  }
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

// ================= SEND TOKEN (OPEN MODAL) =================
function sendToken() {
  const toWallet =
    document.getElementById("toWallet").value.trim();
  const amount =
    Number(document.getElementById("amount").value);

  if (!toWallet || amount <= 0) {
    alert("❌ Invalid data");
    return;
  }

  pendingTx = {
    toWallet,
    amount,
    gas: GAS_FEE,
    total: amount + GAS_FEE
  };

  document.getElementById("cmFrom").innerText =
    document.getElementById("walletAddr").innerText;
  document.getElementById("cmTo").innerText = toWallet;
  document.getElementById("cmAmount").innerText = amount;
  document.getElementById("cmGas").innerText = GAS_FEE;
  document.getElementById("cmTotal").innerText =
    pendingTx.total;

  document
    .getElementById("confirmModal")
    .classList.remove("hidden");
}

// ================= CONFIRM SEND =================
async function confirmSend() {
  if (!pendingTx) return;

  try {
    const res = await fetch("/api/wallet/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: TELEGRAM_ID,
        toWallet: pendingTx.toWallet,
        amount: pendingTx.amount
      })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    alert(
      `✅ Sent ${data.sent} TOKEN\n⛽ Gas Fee: ${data.gasFee}`
    );

    pendingTx = null;
    closeConfirm();
    loadWallet();
    loadHistory();

  } catch (e) {
    alert(e.toString().replaceAll("_", " "));
    closeConfirm();
  }
}

// ================= CLOSE MODAL =================
function closeConfirm() {
  document
    .getElementById("confirmModal")
    .classList.add("hidden");
  pendingTx = null;
}

// ================= TRANSACTION HISTORY =================
async function loadHistory() {
  try {
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

    if (!data.history || data.history.length === 0) {
      list.innerHTML = "<p>No transactions yet</p>";
      return;
    }

    data.history.forEach(tx => {
      const type =
        tx.fromWallet === data.walletAddress
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

  } catch (e) {
    console.error(e);
  }
}

// ================= NAV =================
function goBack() {
  window.history.back();
}

// ================= INIT =================
loadWallet();
loadHistory();
