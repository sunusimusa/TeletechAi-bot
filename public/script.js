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

/* ================= SCRATCH CANVAS ================= */
const canvas = document.getElementById("scratchCanvas");
if (!canvas) return;

const ctx = canvas.getContext("2d");

/* real canvas size (MUHIMMI) */
const W = canvas.width;
const H = canvas.height;

/* state */
let scratching = false;
let scratched = false;

/* fill cover */
ctx.fillStyle = "#9e9e9e";
ctx.fillRect(0, 0, W, H);
ctx.globalCompositeOperation = "destination-out";

/* scratch brush */
function scratch(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

/* % cleared */
function scratchedPercent() {
  const img = ctx.getImageData(0, 0, W, H).data;
  let cleared = 0;

  for (let i = 3; i < img.length; i += 4) {
    if (img[i] === 0) cleared++;
  }

  return (cleared / (W * H)) * 100;
}

/* ================= MOUSE ================= */
canvas.addEventListener("mousedown", e => {
  scratching = true;
});

canvas.addEventListener("mouseup", () => {
  scratching = false;
});

canvas.addEventListener("mousemove", e => {
  if (!scratching || scratched) return;
  scratch(e.offsetX, e.offsetY);
  checkScratch();
});

/* ================= TOUCH (ANDROID) ================= */
canvas.addEventListener("touchstart", e => {
  e.preventDefault(); // 🔥 MUHIMMI
  scratching = true;
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  scratching = false;
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault(); // 🔥 MUHIMMI
  if (!scratching || scratched) return;

  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];

  scratch(
    t.clientX - rect.left,
    t.clientY - rect.top
  );

  checkScratch();
}, { passive: false });

/* ================= CHECK ================= */
function checkScratch() {
  if (scratched) return;

  const p = scratchedPercent();
  if (p >= 60) {
    scratched = true;
    canvas.style.display = "none";
    claimScratchReward();
  }
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

function spawnCoins(count = 10) {
  const container = document.body;

  for (let i = 0; i < count; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";

    // random start
    coin.style.left = Math.random() * window.innerWidth + "px";
    coin.style.top = "-30px";

    container.appendChild(coin);

    const duration = 1200 + Math.random() * 800;
    const xMove = (Math.random() - 0.5) * 200;

    coin.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        {
          transform: `translate(${xMove}px, ${
            window.innerHeight + 100
          }px) scale(0.6)`,
          opacity: 0
        }
      ],
      {
        duration,
        easing: "cubic-bezier(.25,.8,.25,1)"
      }
    );

    setTimeout(() => coin.remove(), duration);
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
    conf.style.backgroundColor =
      ["#ffd700", "#ff5722", "#4caf50", "#03a9f4"][
        Math.floor(Math.random() * 4)
      ];

    document.body.appendChild(conf);

    const duration = 1000 + Math.random() * 1000;
    const x = (Math.random() - 0.5) * 300;

    conf.animate(
      [
        { transform: "translate(0,0)", opacity: 1 },
        {
          transform: `translate(${x}px, ${
            window.innerHeight
          }px) rotate(${Math.random() * 720}deg)`,
          opacity: 0
        }
      ],
      {
        duration,
        easing: "ease-out"
      }
    );

    setTimeout(() => conf.remove(), duration);
  }
}
