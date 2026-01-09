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


