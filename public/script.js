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

// 🔓 ANDROID AUDIO UNLOCK (MUHIMMI)
document.addEventListener("click", () => {
  ["winSound", "loseSound"].forEach(id => {
    const s = document.getElementById(id);
    if (s) {
      s.play().then(() => {
        s.pause();
        s.currentTime = 0;
      }).catch(() => {});
    }
  });
}, { once: true });

/* ================= BOX ANIMATION ================= */
function animateBox(box, reward) {
  const rewardEl = box.querySelector(".reward");
  if (!rewardEl) return;

  box.classList.add("opened");

  if (reward > 0) {
    rewardEl.textContent = `+${reward}`;
    playSound("winSound");
  } else {
    rewardEl.textContent = "Empty";
    playSound("loseSound");
  }

  rewardEl.classList.remove("hidden");

  setTimeout(() => {
    rewardEl.classList.add("hidden");
    rewardEl.textContent = "";
    box.classList.remove("opened");
  }, 1500);
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
