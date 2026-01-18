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

const canvas = document.getElementById("scratchCanvas");
const ctx = canvas.getContext("2d");

let scratching = false;
let scratched = false;

// fill cover
ctx.fillStyle = "#9e9e9e";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.globalCompositeOperation = "destination-out";

// draw scratch circle
function scratch(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

// get % cleared
function getScratchedPercent() {
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let cleared = 0;

  for (let i = 3; i < img.data.length; i += 4) {
    if (img.data[i] === 0) cleared++;
  }

  return (cleared / (canvas.width * canvas.height)) * 100;
}

// mouse
canvas.addEventListener("mousedown", () => scratching = true);
canvas.addEventListener("mouseup", () => scratching = false);
canvas.addEventListener("mousemove", e => {
  if (!scratching || scratched) return;
  scratch(e.offsetX, e.offsetY);
  checkScratch();
});

// touch (mobile)
canvas.addEventListener("touchstart", () => scratching = true);
canvas.addEventListener("touchend", () => scratching = false);
canvas.addEventListener("touchmove", e => {
  if (!scratching || scratched) return;
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  scratch(t.clientX - rect.left, t.clientY - rect.top);
  checkScratch();
});

async function checkScratch() {
  const percent = getScratchedPercent();
  if (percent > 60 && !scratched) {
    scratched = true;
    canvas.style.display = "none";
    claimScratchReward();
  }
}

let scratched = false;

function checkScratch(percent) {
  if (!SCRATCH_UNLOCKED || scratched) return;

  if (percent >= 60) {
    scratched = true;
    claimScratchReward();
  }
}

async function claimScratchReward() {
  showStatus("🎁 Claiming reward...");

  try {
    const res = await fetch("/api/scratch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    USER.balance = data.balance;
    USER.energy = data.energy;

    showStatus(
      `🎉 +${data.reward.points} points, +${data.reward.energy} energy`
    );

    updateUI();

    // 🔁 reset
    SCRATCH_UNLOCKED = false;
    scratched = false;

    document.getElementById("scratchCard").classList.add("hidden");
    document.getElementById("scratchLock").classList.remove("hidden");

  } catch {
    showStatus("❌ Network error");
  }
}
