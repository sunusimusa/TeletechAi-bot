const tg = window.Telegram.WebApp;
tg.expand();

let USER_ID = tg.initDataUnsafe?.user?.id;

async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData: tg.initData })
  });

  const data = await res.json();

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

loadUser();

async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData: tg.initData })
  });

  const data = await res.json();

  if (data.error) return alert(data.error);

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

function daily() {
  fetch("/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData: tg.initData })
  }).then(r => r.json()).then(d => {
    alert("🎁 Daily claimed!");
    loadUser();
  });
}

function openFight() {
  window.location.href = "/game/fight.html";
}

function openProfile() {
  alert("Profile coming soon 👤");
}

// ===== FIGHT SYSTEM =====

let playerHP = 100;
let enemyHP = 100;
let playerXP = 0;

function updateBars() {
  document.getElementById("playerHP").style.width = playerHP + "%";
  document.getElementById("enemyHP").style.width = enemyHP + "%";
}

function enemyAI() {
  let action = Math.random();

  // Enemy smart logic
  if (enemyHP < 30 && action < 0.4) {
    // DEFEND
    enemyHP += 10;
    if (enemyHP > 100) enemyHP = 100;
    alert("🛡️ Enemy defended!");
    return;
  }

  // ATTACK
  let damage = Math.floor(Math.random() * 12) + 6;

  // Critical hit
  if (Math.random() < 0.2) {
    damage *= 2;
    alert("💥 Enemy Critical Hit!");
  }

  playerHP -= damage;
  if (playerHP < 0) playerHP = 0;
}

function attack() {
  if (playerHP <= 0 || enemyHP <= 0) return;

  // Player attack
  let dmg = Math.floor(Math.random() * 15) + 5;
  enemyHP -= dmg;

  if (enemyHP < 0) enemyHP = 0;

  // Enemy turn
  setTimeout(() => {
    enemyAI();
    updateBars();

    if (enemyHP <= 0) {
      playerXP += 20;
      alert("🏆 YOU WIN!\nXP +20");
      resetGame();
    }

    if (playerHP <= 0) {
      alert("💀 YOU LOST!");
      resetGame();
    }
  }, 500);

  updateBars();
}

function resetGame() {
  playerHP = 100;
  enemyHP = 100;
  updateBars();
}
