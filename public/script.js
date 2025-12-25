/* ===============================
   TELETECH AI – FRONTEND SCRIPT
   =============================== */

/*
  👉 A NAN NE ZAKA SA TELEGRAM USER ID
  Idan Mini App ne daga Telegram:
  window.Telegram.WebApp.initDataUnsafe.user.id
*/

let userId = "demo-user"; // DEFAULT (idan ba Telegram ba)

// ====== TELEGRAM AUTO DETECT ======
if (window.Telegram && window.Telegram.WebApp) {
  const tg = window.Telegram.WebApp;
  tg.ready();

  if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    userId = tg.initDataUnsafe.user.id.toString();
  }
}

// ====== INIT USER ======
async function init() {
  try {
    const res = await fetch("/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    updateBalance(data.balance);
  } catch (e) {
    console.error("Init error", e);
  }
}

// ====== TAP ======
async function tap() {
  try {
    const res = await fetch("/tap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    updateBalance(data.balance);
  } catch (e) {
    console.error("Tap error", e);
  }
}

// ====== WITHDRAW ======
async function withdraw() {
  const wallet = prompt("Enter your wallet address:");

  if (!wallet) {
    alert("Wallet is required");
    return;
  }

  try {
    const res = await fetch("/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userId,
        wallet: wallet
      })
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
    } else {
      alert("Withdraw request sent!");
      updateBalance(0);
    }
  } catch (e) {
    console.error("Withdraw error", e);
  }
}

// ====== UPDATE BALANCE UI ======
function updateBalance(amount) {
  const el = document.getElementById("balance");
  if (el) {
    el.innerText = amount + " TT";
  }
}

// ====== START ======
init();
