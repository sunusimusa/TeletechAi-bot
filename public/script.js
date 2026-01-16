/* =====================================================
   LUCKY BOX – FINAL CLEAN SCRIPT.JS
   UI + ANIMATION + SOUND ONLY
   (DEPENDS ON index.js STATE)
===================================================== */

/* ================= SOUND ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// 🔓 Android sound unlock (run once)
document.addEventListener(
  "click",
  () => {
    ["clickSound", "winSound", "loseSound", "errorSound"].forEach(id => {
      const s = document.getElementById(id);
      if (!s) return;
      s.play().then(() => s.pause()).catch(() => {});
    });
  },
  { once: true }
);

/* ================= BOX ANIMATION ================= */
function animateBox(box, reward) {
  const rewardEl = box.querySelector(".reward");
  if (!rewardEl) return;

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

/* ================= OPEN BOX UI ================= */
async function openBoxUI(box, type) {
  if (openingLocked) return;

  if (!navigator.onLine) {
    playSound("errorSound");
    alert("📡 Internet required");
    return;
  }

  openingLocked = true;
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
      alert("❌ " + data.error);
      openingLocked = false;
      return;
    }

    // 🎁 animation + sound
    animateBox(box, data.reward);

    // 🔄 update global state (index.js owns truth)
    balance = data.balance;
    energy = data.energy;
    freeTries = data.freeTries;

    setTimeout(() => {
      updateUI(); // from index.js
      openingLocked = false;
    }, 600);

  } catch (e) {
    playSound("errorSound");
    alert("❌ Network error");
    openingLocked = false;
  }
}

/* ================= UI WRAPPERS ================= */
async function dailyBonusUI() {
  playSound("winSound");
  await dailyBonus(); // index.js
}

async function watchAdUI() {
  playSound("clickSound");
  await watchAd(); // index.js
}

/* ================= EXTERNAL LINKS ================= */
function linkTelegram() {
  window.open("https://t.me/TeleTechAiBot", "_blank");
}
