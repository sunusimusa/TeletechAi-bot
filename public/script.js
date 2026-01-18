/* =====================================================
   SCRIPT.JS – UI + ANIMATION + SOUND (FINAL FIXED)
   ANDROID WEBVIEW & PWA SAFE
===================================================== */

/* ================= AUDIO STATE ================= */
let SOUND_UNLOCKED = false;

/* ================= SOUND PLAY ================= */
function playSound(id) {
  const s = document.getElementById(id);
  if (!s) return;

  if (!SOUND_UNLOCKED) {
    console.log("🔇 Sound locked:", id);
    return;
  }

  try {
    s.currentTime = 0;
    s.play().catch(() => {});
  } catch {}
}

/* ================= AUDIO UNLOCK (ANDROID SAFE) ================= */
function unlockSounds() {
  if (SOUND_UNLOCKED) return;

  const ids = ["clickSound", "winSound", "loseSound", "errorSound"];

  ids.forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;

    try {
      s.muted = true;
      s.play()
        .then(() => {
          s.pause();
          s.currentTime = 0;
          s.muted = false;
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

  playSound("clickSound");
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
let ctx, W, H;

if (canvas) {
  ctx = canvas.getContext("2d");
  W = canvas.width;
  H = canvas.height;

  let scratching = false;
  let scratched = false;

  function initScratch() {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#9e9e9e";
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "destination-out";
    scratched = false;
    canvas.style.display = "block";
  }

  initScratch();
   function resetScratchCard() {
  if (!canvas) return;

  // reset state
  scratched = false;
  scratching = false;

  // show canvas again
  canvas.style.display = "block";

  // reset drawing
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#9e9e9e";
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "destination-out";
   }
  
  function scratchedPercent() {
    const img = ctx.getImageData(0, 0, W, H).data;
    let cleared = 0;
    for (let i = 3; i < img.length; i += 4) {
      if (img[i] === 0) cleared++;
    }
    return (cleared / (W * H)) * 100;
  }

  function checkScratch() {
    if (scratched) return;
    if (scratchedPercent() >= 60) {
      scratched = true;
      canvas.style.display = "none";
      claimScratchReward();
    }
  }

  /* mouse */
  canvas.addEventListener("mousedown", () => scratching = true);
  canvas.addEventListener("mouseup", () => scratching = false);
  canvas.addEventListener("mousemove", e => {
    if (!scratching || scratched) return;
    scratch(e.offsetX, e.offsetY);
    checkScratch();
  });

  /* touch */
  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    scratching = true;
  }, { passive: false });

  canvas.addEventListener("touchend", e => {
    e.preventDefault();
    scratching = false;
  }, { passive: false });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!scratching || scratched) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    scratch(t.clientX - rect.left, t.clientY - rect.top);
    checkScratch();
  }, { passive: false });
}

/* =====================================================
   COIN FLY (ONE VERSION ONLY)
===================================================== */
function spawnCoins(count = 12) {
  const target = document.getElementById("balance");
  if (!target) return;

  const rect = target.getBoundingClientRect();

  for (let i = 0; i < count; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";
    coin.style.left = window.innerWidth / 2 + "px";
    coin.style.top = window.innerHeight / 2 + "px";
    document.body.appendChild(coin);

    setTimeout(() => {
      coin.style.left = rect.left + 20 + "px";
      coin.style.top = rect.top + 10 + "px";
      coin.style.opacity = "0";
    }, 50);

    setTimeout(() => coin.remove(), 900);
  }
}

/* =====================================================
   CONFETTI
===================================================== */
function launchConfetti(count = 30) {
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * window.innerWidth + "px";
    c.style.backgroundColor =
      ["#ffd700", "#ff5722", "#4caf50", "#03a9f4"][
        Math.floor(Math.random() * 4)
      ];

    document.body.appendChild(c);

    c.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: `translateY(${window.innerHeight}px)`, opacity: 0 }
      ],
      { duration: 1500 + Math.random() * 1000 }
    );

    setTimeout(() => c.remove(), 2000);
  }
}
