/* ================= USER ID ================= */
let USER_ID = localStorage.getItem("USER_ID");
if (!USER_ID) {
  USER_ID = "user_" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("USER_ID", USER_ID);
}

/* ================= STATE ================= */
let balance = 0;
let energy = 0;
let tokens = 0;
let freeTries = 0;

/* ================= LOAD USER ================= */
async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();
    if (data.error) throw data.error;

    balance = data.balance;
    energy = data.energy;
    tokens = data.tokens;
    freeTries = data.freeTries;

    updateUI();

    document.getElementById("appStatus").innerText =
      "✅ App Loaded (Browser Mode)";

  } catch (err) {
    alert("Failed to load user");
    console.error(err);
  }
}

/* ================= OPEN BOX ================= */
async function openBox(el) {
  try {
    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }

    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    alert("🎁 You won: " + data.reward);
    updateUI();

  } catch (e) {
    alert("Server error");
  }
}

/* ================= UI ================= */
function updateUI() {
  document.getElementById("balance").innerText =
    "Balance: " + balance;

  document.getElementById("energy").innerText =
    "Energy: " + energy;

  document.getElementById("freeTries").innerText =
    "Free tries: " + freeTries;

  document.getElementById("tokens").innerText =
    "Tokens: " + tokens;
}

/* ================= START ================= */
document.addEventListener("DOMContentLoaded", loadUser);

/* ================= DAILY BONUS ================= */
async function claimDaily() {
  try {
    const res = await fetch("/api/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();

    if (data.error) {
      document.getElementById("dailyMsg").innerText =
        "❌ Come back tomorrow";
      return;
    }

    balance = data.balance;
    energy = data.energy;

    document.getElementById("dailyMsg").innerText =
      `🎁 +${data.reward} coins | 🔥 Streak: ${data.streak}`;

    updateUI();

  } catch (e) {
    alert("Daily failed");
  }
}

/* ================= WATCH AD ================= */
async function watchAd() {
  try {
    const btn = document.getElementById("watchAdBtn");
    if (btn) btn.disabled = true;

    // 🎬 fake ad delay (5 sec)
    document.getElementById("adMsg").innerText = "📺 Watching ad...";
    await new Promise(r => setTimeout(r, 5000));

    const res = await fetch("/api/ads/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID })
    });

    const data = await res.json();

    if (data.error) {
      document.getElementById("adMsg").innerText =
        data.error.replaceAll("_", " ");
      return;
    }

    energy = data.energy;
    balance = data.balance;

    document.getElementById("adMsg").innerText =
      `⚡ +${data.rewardEnergy} Energy | 💰 +${data.rewardCoins} coins
       (${data.adsLeft} ads left today)`;

    updateUI();

  } catch (e) {
    alert("Ad failed");
  } finally {
    const btn = document.getElementById("watchAdBtn");
    if (btn) btn.disabled = false;
  }
}

// ===== GLOBAL =====
const USER_ID =
  localStorage.getItem("user_id") ||
  crypto.randomUUID();

localStorage.setItem("user_id", USER_ID);

// 🔗 REF FROM URL
const params = new URLSearchParams(window.location.search);
const REF = params.get("ref");

async function loadUser() {
  const res = await fetch("/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: USER_ID,
      ref: REF
    })
  });

  const data = await res.json();
  if (data.error) return alert(data.error);

  balance = data.balance;
  energy = data.energy;
  tokens = data.tokens;
  freeTries = data.freeTries;
  referralCode = data.referralCode;
  referralsCount = data.referralsCount;

  updateUI();

  // 🔗 Referral link
  document.getElementById("refLink").value =
    `${location.origin}/?ref=${referralCode}`;
}

function copyRef() {
  navigator.clipboard.writeText(
    document.getElementById("refLink").value
  );
  alert("🔗 Referral link copied!");
}

function updateUI() {
  document.getElementById("balance").innerText = `Balance: ${balance}`;
  document.getElementById("energy").innerText = `Energy: ${energy}`;
  document.getElementById("tokens").innerText = `Tokens: ${tokens}`;
  document.getElementById("freeTries").innerText = `Free tries: ${freeTries}`;
  document.getElementById("refCount").innerText =
    `👥 Referrals: ${referralsCount}`;
}

async function buyToken(amount = 1) {
  const res = await fetch("/api/token/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: USER_ID,
      amount
    })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  balance = data.balance;
  tokens = data.tokens;
  updateUI();

  alert(`🪙 Bought ${amount} TOKEN`);
}

async function sellToken(amount = 1) {
  const res = await fetch("/api/token/sell", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: USER_ID,
      amount
    })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  balance = data.balance;
  tokens = data.tokens;
  updateUI();

  alert(`💰 Sold ${amount} TOKEN`);
}

async function withdraw() {
  const walletInput = document.getElementById("wallet");
  const amountInput = document.getElementById("amount");

  const wallet = walletInput.value.trim();
  const amount = Number(amountInput.value);

  if (!wallet || !amount || amount <= 0) {
    alert("❌ Enter valid wallet & amount");
    return;
  }

  const res = await fetch("/api/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: USER_ID,
      wallet,
      amount
    })
  });

  const data = await res.json();
  if (data.error) {
    alert(data.error.replaceAll("_", " "));
    return;
  }

  tokens = data.tokens;
  updateUI();

  walletInput.value = "";
  amountInput.value = "";

  alert("✅ Withdraw request sent (pending)");
}

function openLeaderboard() {
  window.location.href = "/leaderboard.html";
}


