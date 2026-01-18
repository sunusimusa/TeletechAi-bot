/* =====================================================
   SCRIPT.JS – UI + ANIMATION + SOUND (FINAL CLEAN)
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
  } catch {
    // Android/WebView na iya hana autoplay
  }
}

/* ================= AUDIO UNLOCK (ONCE) ================= */
function unlockSounds() {
  if (SOUND_UNLOCKED) return;

  ["winSound", "loseSound", "errorSound", "clickSound"].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;

    try {
      s.volume = 0;
      s.play()
        .then(() => {
          s.pause();
          s.currentTime = 0;
          s.volume = 1;
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

/* =====================================================
   SCRATCH CARD (REAL SWIPE / RUB)
===================================================== */

const canvas = document.getElementById("scratchCanvas");
if (!canvas) {
  console.warn("⚠️ scratchCanvas not found");
} else {
  const ctx = canvas.getContext("2d");

  let scratching = false;
  let scratched = false;

  /* ===== INIT COVER ===== */
  ctx.fillStyle = "#9e9e9e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "destination-out";

  /* ===== DRAW SCRATCH ===== */
  function drawScratch(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ===== CALC CLEARED % ===== */
  function getScratchedPercent() {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;

    for (let i = 3; i < img.data.length; i += 4) {
      if (img.data[i] === 0) cleared++;
    }

    return (cleared / (canvas.width * canvas.height)) * 100;
  }

  /* ===== CHECK SCRATCH ===== */
  function checkScratchProgress() {
    if (!SCRATCH_UNLOCKED || scratched) return;

    const percent = getScratchedPercent();
    if (percent >= 60) {
      scratched = true;
      canvas.style.display = "none";
      claimScratchReward();
    }
  }

  /* ===== MOUSE EVENTS ===== */
  canvas.addEventListener("mousedown", () => (scratching = true));
  canvas.addEventListener("mouseup", () => (scratching = false));
  canvas.addEventListener("mouseleave", () => (scratching = false));

  canvas.addEventListener("mousemove", e => {
    if (!scratching || scratched) return;
    drawScratch(e.offsetX, e.offsetY);
    checkScratchProgress();
  });

  /* ===== TOUCH EVENTS ===== */
  canvas.addEventListener("touchstart", () => (scratching = true));
  canvas.addEventListener("touchend", () => (scratching = false));
  canvas.addEventListener("touchcancel", () => (scratching = false));

  canvas.addEventListener("touchmove", e => {
    if (!scratching || scratched) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    drawScratch(t.clientX - rect.left, t.clientY - rect.top);
    checkScratchProgress();
  });

  /* ===== RESET (CALLED AFTER CLAIM) ===== */
  function resetScratchCard() {
    scratched = false;
    scratching = false;

    canvas.style.display = "block";
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#9e9e9e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "destination-out";
  }

  /* expose reset if needed */
  window.resetScratchCard = resetScratchCard;
}

/* =====================================================
   SCRATCH CLAIM (SERVER)
===================================================== */

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

    updateUI();

    showStatus(
      `🎉 +${data.reward.points} points, ⚡ +${data.reward.energy} energy`
    );

    // 🔒 reset scratch state
    SCRATCH_UNLOCKED = false;

    const card = document.getElementById("scratchCard");
    const lock = document.getElementById("scratchLock");

    if (card) card.classList.add("hidden");
    if (lock) lock.classList.remove("hidden");

    if (window.resetScratchCard) {
      window.resetScratchCard();
    }

  } catch {
    showStatus("❌ Network error");
  }
}

/* =====================================================
   COIN FLY ANIMATION (REWARD FEEDBACK)
===================================================== */

function spawnCoins(amount = 10) {
  const balanceEl = document.getElementById("balance");
  if (!balanceEl) return;

  const target = balanceEl.getBoundingClientRect();

  for (let i = 0; i < amount; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";

    // start random position (center screen)
    coin.style.left = window.innerWidth / 2 + (Math.random() * 60 - 30) + "px";
    coin.style.top  = window.innerHeight / 2 + (Math.random() * 60 - 30) + "px";

    document.body.appendChild(coin);

    // animate to balance
    setTimeout(() => {
      coin.style.left = target.left + 20 + "px";
      coin.style.top  = target.top + 10 + "px";
      coin.style.opacity = "0";
      coin.style.transform = "scale(0.5)";
    }, 50);

    setTimeout(() => coin.remove(), 900);
  }
}

/* =====================================================
   CONFETTI (SAFE LIGHT VERSION)
===================================================== */

function launchConfetti(count = 30) {
  for (let i = 0; i < count; i++) {
    const conf = document.createElement("div");
    conf.className = "confetti";

    conf.style.left = Math.random() * window.innerWidth + "px";
    conf.style.background =
      ["#ffd700", "#ff9800", "#ffffff"][Math.floor(Math.random() * 3)];

    document.body.appendChild(conf);

    setTimeout(() => conf.remove(), 1500);
  }
}
