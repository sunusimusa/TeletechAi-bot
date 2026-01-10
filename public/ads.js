let seconds = 10;
const countdown = document.getElementById("countdown");
const claimBtn = document.getElementById("claimBtn");

const timer = setInterval(() => {
  seconds--;
  countdown.innerText = `⏳ Please wait ${seconds} seconds`;

  if (seconds <= 0) {
    clearInterval(timer);
    countdown.innerText = "✅ Ad completed";
    claimBtn.classList.remove("hidden");
  }
}, 1000);

claimBtn.onclick = () => {
  let energy = Number(localStorage.getItem("energy")) || 0;
  let maxEnergy = Number(localStorage.getItem("MAX_ENERGY")) || 9999;

  energy = Math.min(maxEnergy, energy + 20);
  localStorage.setItem("energy", energy);

  alert("⚡ Energy +20 added");
  location.href = "/";
};

function goBack() {
  location.href = "/";
}
