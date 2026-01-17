/* =====================================================
   SCRIPT.JS – UI + ANIMATION + SOUND (FINAL)
   ANDROID WEBVIEW & PWA SAFE
===================================================== */

/* ================= SOUND ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;

  try {
    s.pause();
    s.currentTime = 0;
    s.play().catch(() => {});
  } catch (e) {
    // shiru – Android ba zai yarda ba sai unlock
  }
}

/* 🔓 ANDROID / WEBVIEW AUDIO UNLOCK (ONCE) */
document.addEventListener(
  "click",
  () => {
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
  },
  { once: true }
);

/* ================= BOX ANIMATION ================= */
function animateBox(box, reward) {
  if (!box) return;

  // tabbata OPEN BOX label ya kasance
  let label = box.querySelector(".box-label");
  if (!label) {
    label = document.createElement("span");
    label.className = "box-label";
    label.innerText = "OPEN BOX";
    box.innerHTML = "";
    box.appendChild(label);
  }

  box.classList.add("opened");

  if (reward > 0) {
    label.innerText = "+" + reward;
    playSound("winSound");
  } else {
    label.innerText = "EMPTY";
    playSound("loseSound");
  }

  setTimeout(() => {
    label.innerText = "OPEN BOX";
    box.classList.remove("opened");
  }, 1200);
}
