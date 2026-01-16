/* =====================================================
   LUCKY BOX – FINAL CLEAN SCRIPT.JS
   UI + ANIMATION + SOUND ONLY
===================================================== */

/* ================= SOUND ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// Android unlock
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

/* ================= UI WRAPPERS ================= */
async function openBoxUI(box, type) {
  playSound("clickSound");
  const reward = await openBox(type); // 👈 index.js
  if (reward !== undefined) {
    animateBox(box, reward);
  }
}

async function dailyBonusUI() {
  playSound("winSound");
  await dailyBonus(); // 👈 index.js
}

async function watchAdUI() {
  playSound("clickSound");
  await watchAd(); // 👈 index.js
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
