function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;
  s.currentTime = 0;
  s.play().catch(() => {});
}

// 🔓 Android sound unlock
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
  }, 1200);
}
