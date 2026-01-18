/* =====================================================
   SCRIPT.JS – UI + ANIMATION + SOUND (FINAL)
   ANDROID WEBVIEW & PWA SAFE
===================================================== */

/* ================= AUDIO STATE ================= */
let SOUND_UNLOCKED = false;

/* ================= SOUND PLAY ================= */
function playSound(id) {
  if (!SOUND_UNLOCKED) return;

  const s = document.getElementById(id);
  if (!s) return;

  try {
    s.pause();
    s.currentTime = 0;
    s.play().catch(() => {});
  } catch (e) {
    // shiru – Android/WebView zai iya hana
  }
}

/* ================= AUDIO UNLOCK (ONCE) ================= */
/*
  ⚠️ MUHIMMI:
  Android / WebView ba zai yarda da sound ba
  sai an sami USER INTERACTION (click / touch)
*/
function unlockSounds() {
  if (SOUND_UNLOCKED) return;

  ["winSound", "loseSound", "errorSound", "clickSound"].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;

    try {
      s.volume = 0; // 🔕 fara shiru
      s.play()
        .then(() => {
          s.pause();
          s.currentTime = 0;
          s.volume = 1; // 🔊 dawo da sauti
        })
        .catch(() => {});
    } catch {}
  });

  SOUND_UNLOCKED = true;
  console.log("🔊 Sounds unlocked");
}

document.addEventListener("click", unlockSounds, { once: true });
document.addEventListener("touchstart", unlockSounds, { once: true });

/* ================= BOX ANIMATION ================= */
function animateBox(box, reward) {
  if (!box) return;

  // tabbata akwai label
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