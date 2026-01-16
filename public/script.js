/* =====================================================
   LUCKY BOX – FINAL CLEAN SCRIPT.JS
   UI + ANIMATION + SOUND ONLY
   NO localStorage
===================================================== */

/* ================= SOUND ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// 🔓 Android / Play Store audio unlock
document.addEventListener(
  "click",
  () => {
    ["clickSound", "winSound", "loseSound", "errorSound"].forEach(id => {
      const s = document.getElementById(id);
      if (s) s.play().then(() => s.pause()).catch(() => {});
    });
  },
  { once: true }
);

/* ================= AGREEMENT ================= */
function agreementInit() {
  const modal = document.getElementById("agreementModal");
  const btn = document.getElementById("agreeBtn");
  if (!modal || !btn) return;

  modal.classList.remove("hidden");

  btn.onclick = () => {
    modal.classList.add("hidden");
  };
}

/* ================= BOX ANIMATION ================= */
function animateBox(box, reward) {
  const rewardEl = box.querySelector(".reward");
  box.classList.add("opened");

  if (reward > 0) {
    playSound("winSound");
    rewardEl.textContent = `+${reward}`;
  } else {
    playSound("loseSound");
    rewardEl.textContent = "Empty";
  }

  rewardEl.classList.remove("hidden");

  setTimeout(() => {
    box.classList.remove("opened");
    rewardEl.classList.add("hidden");
    rewardEl.textContent = "";
  }, 1500);
}

/* ================= OPEN BOX (UI WRAPPER) ================= */
async function openBoxUI(box, type) {
  if (!navigator.onLine) {
    alert("📡 Internet required");
    return;
  }

  playSound("clickSound");

  try {
    const res = await fetch("/api/open", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    });

    const data = await res.json();
    if (data.error) {
      playSound("errorSound");
      return alert("❌ " + data.error);
    }

    animateBox(box, data.reward);

    // update global UI (from index.js)
    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;
    updateUI();

  } catch {
    playSound("errorSound");
    alert("❌ Network error");
  }
}

/* ================= WATCH AD UI ================= */
async function watchAdUI() {
  if (!navigator.onLine) {
    alert("📡 Internet required");
    return;
  }

  const btn = document.getElementById("watchAdBtn");
  const status = document.getElementById("adStatus");
  if (!btn || !status) return;

  btn.disabled = true;
  let t = 30;

  status.classList.remove("hidden");
  status.innerText = `⏳ Watching ad... ${t}s`;

  const timer = setInterval(() => {
    t--;
    status.innerText = `⏳ Watching ad... ${t}s`;

    if (t <= 0) {
      clearInterval(timer);
      claimAdRewardUI(btn, status);
    }
  }, 1000);
}

async function claimAdRewardUI(btn, status) {
  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      status.innerText = "❌ " + data.error;
      btn.disabled = false;
      return;
    }

    playSound("winSound");

    balance = data.balance;
    energy = data.energy;
    updateUI();

    status.innerText = "✅ +20 Energy added!";
  } catch {
    status.innerText = "❌ Network error";
  } finally {
    setTimeout(() => {
      status.classList.add("hidden");
      btn.disabled = false;
    }, 2000);
  }
}

/* ================= DAILY BONUS UI ================= */
async function dailyBonusUI() {
  try {
    const res = await fetch("/api/daily", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    playSound("winSound");

    balance = data.balance;
    energy = data.energy;
    updateUI();

    alert("🎁 Daily bonus received!");
  } catch {
    alert("❌ Network error");
  }
}

/* ================= NAV ================= */
function openWallet() {
  location.href = "/wallet.html";
}

function openFounderStats() {
  location.href = "/founder-stats.html";
}

function linkTelegram() {
  window.open("https://t.me/TeleTechAiBot", "_blank");
}
