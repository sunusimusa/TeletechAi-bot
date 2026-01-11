/* =====================================================
   GLOBAL STATE (BROWSER ONLY – CLEAN)
===================================================== */
const FOUNDER_USER_ID = "SUNUSI_001";

let userId = localStorage.getItem("userId") || FOUNDER_USER_ID;
let wallet = localStorage.getItem("wallet");

let balance = Number(localStorage.getItem("balance")) || 0;
let tokens = Number(localStorage.getItem("tokens")) || 10;
let energy = Number(localStorage.getItem("energy")) || 50;
let freeTries = Number(localStorage.getItem("freeTries")) || 3;
let referralsCount = Number(localStorage.getItem("referralsCount")) || 0;

let proLevel = Number(localStorage.getItem("proLevel")) || 0;
let MAX_ENERGY = 100;
let openingLocked = false;

/* =====================================================
   FOUNDER AUTO
===================================================== */
if (userId === FOUNDER_USER_ID) {
  proLevel = 4;
  MAX_ENERGY = 9999;
  energy = 9999;
  freeTries = 9999;
}

/* =====================================================
   INIT
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  ensureWallet();
  handleReferralJoin();
  agreementInit();
  applyProRules();
  updateUI();
});

/* =====================================================
   AGREEMENT
===================================================== */
function agreementInit() {
  const modal = document.getElementById("agreementModal");
  const btn = document.getElementById("agreeBtn");

  if (!modal || !btn) return;

  if (localStorage.getItem("agreed") === "yes") {
    modal.classList.add("hidden");
  } else {
    modal.classList.remove("hidden");
  }

  btn.onclick = () => {
    localStorage.setItem("agreed", "yes");
    modal.classList.add("hidden");
  };
}

/* =====================================================
   WALLET + REFERRAL LINK
===================================================== */
function ensureWallet() {
  if (!wallet) {
    wallet = "TTECH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem("wallet", wallet);
  }

  const refLink = document.getElementById("refLink");
  if (refLink) {
    refLink.value = location.origin + "/?ref=" + wallet;
  }
}

/* =====================================================
   REFERRAL SYSTEM (LOCAL ONLY)
===================================================== */
function handleReferralJoin() {
  const params = new URLSearchParams(location.search);
  const ref = params.get("ref");

  if (!ref) return;
  if (localStorage.getItem("joinedByRef")) return;
  if (ref === wallet) return; // hana self-referral

  referralsCount++;
  localStorage.setItem("referralsCount", referralsCount);
  localStorage.setItem("joinedByRef", "yes");

  // bonus ga sabon user
  balance += 300;
  energy += 20;
}

export function generateReferralCode() {
  return "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* =====================================================
   PRO RULES
===================================================== */
function applyProRules() {
  if (proLevel === 1) MAX_ENERGY = 150;
  if (proLevel === 2) MAX_ENERGY = 200;
  if (proLevel === 3) MAX_ENERGY = 300;
  if (proLevel >= 4) MAX_ENERGY = 9999;

  energy = Math.min(energy, MAX_ENERGY);
}

/* =====================================================
   UI UPDATE
===================================================== */
function updateUI() {
  saveState();

  setText("balance", `Balance: ${balance}`);
  setText("tokens", `Tokens: ${tokens}`);
  setText("freeTries", `Free tries: ${freeTries}`);
  setText("refCount", `👥 Referrals: ${referralsCount}`);
  setText("energy", `Energy: ${energy} / ${MAX_ENERGY}`);

  const bar = document.getElementById("energyFill");
  if (bar) {
    bar.style.width = Math.min((energy / MAX_ENERGY) * 100, 100) + "%";
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.innerText = text;
}

function saveState() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("tokens", tokens);
  localStorage.setItem("energy", energy);
  localStorage.setItem("freeTries", freeTries);
  localStorage.setItem("proLevel", proLevel);
  localStorage.setItem("referralsCount", referralsCount);
  localStorage.setItem("userId", userId);
}

/* =====================================================
   BOX GAME (WITH IMAGE + REWARD)
===================================================== */
function openBox(box, type) {
  if (openingLocked || box.classList.contains("opened")) return;
  openingLocked = true;

  // COST
  if (freeTries > 0) freeTries--;
  else if (energy >= 10) energy -= 10;
  else {
    alert("❌ Not enough energy");
    openingLocked = false;
    return;
  }

  // REWARD TABLE
  let rewards = [0, 50, 100];
  if (type === "gold") rewards = [100, 200, 500];
  if (type === "diamond") rewards = [300, 500, 1000, 2000];
  if (proLevel >= 3) rewards.push(5000);

  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  balance += reward;

  // FLIP
  box.classList.add("opened");

  const rewardEl = box.querySelector(".reward");
  rewardEl.textContent = reward > 0 ? `💰 +${reward}` : "😢 Empty";
  rewardEl.classList.remove("hidden");

  updateUI();

  setTimeout(() => {
    box.classList.remove("opened");
    rewardEl.classList.add("hidden");
    rewardEl.textContent = "";
    openingLocked = false;
  }, 1800);
}
