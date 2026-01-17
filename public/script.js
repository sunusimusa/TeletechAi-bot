/* =====================================================
   SCRIPT.JS – UI + ANIMATION + SOUND (SAFE)
   ANDROID WEBVIEW READY
===================================================== */

/* ================= SOUND ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;

  try {
    s.currentTime = 0;
    s.play().catch(() => {});
  } catch {}
}

/* 🔓 ANDROID UNLOCK (ONCE) */
document.addEventListener("click", () => {
  ["winSound", "loseSound"].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;

    s.play()
      .then(() => {
        s.pause();
        s.currentTime = 0;
      })
      .catch(() => {});
  });
}, { once: true });

/* ================= BOX ANIMATION ================= */
function animateBox(box, reward) {
  if (!box) return;

  let rewardEl = box.querySelector(".reward");

  // idan babu reward div, mu ƙirƙira
  if (!rewardEl) {
    rewardEl = document.createElement("div");
    rewardEl.className = "reward hidden";
    box.appendChild(rewardEl);
  }

  box.classList.add("opened");

  if (reward > 0) {
    rewardEl.innerText = "+" + reward;
    playSound("winSound");
  } else {
    rewardEl.innerText = "Empty";
    playSound("loseSound");
  }

  rewardEl.classList.remove("hidden");

  setTimeout(() => {
    rewardEl.classList.add("hidden");
    rewardEl.innerText = "";
    box.classList.remove("opened");
  }, 1000);
}
