/* ================= SOUND ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

/* 🔓 ANDROID UNLOCK */
document.addEventListener("click", () => {
  ["winSound", "loseSound", "errorSound"].forEach(id => {
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
