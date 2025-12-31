const tg = window.Telegram.WebApp;
tg.expand();

const initData = tg.initData;
let enemyHP = 100;
let playerHP = 100;

const enemyBar = document.getElementById("enemyHP");
const playerBar = document.getElementById("playerHP");

function updateBars() {
  enemyBar.style.width = enemyHP + "%";
  playerBar.style.width = playerHP + "%";
}

async function attack() {
  if (enemyHP <= 0 || playerHP <= 0) return;

  // player hits enemy
  enemyHP -= Math.floor(Math.random() * 20) + 5;

  // enemy hits back
  playerHP -= Math.floor(Math.random() * 10) + 3;

  updateBars();

  if (enemyHP <= 0) {
    await winFight();
  }

  if (playerHP <= 0) {
    alert("❌ You lost!");
    location.reload();
  }
}

async function winFight() {
  const res = await fetch("/game-win", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      initData: initData,
      reward: 10
    })
  });

  const data = await res.json();

  alert("🏆 You won! +10 coins");
  location.reload();
}
