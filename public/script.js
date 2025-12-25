// ===== TELEGRAM USER =====
const userId = "1248500925"; // daga Telegram (naka)

// ===== STORAGE =====
let balance = 0;

// ===== INIT =====
async function init() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  balance = data.balance;
  updateBalance(balance);
}

async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (data.error) return;

  balance = data.balance;
  updateBalance(balance);
}
// ===== WITHDRAW (DEMO SAVE) =====
withdrawBtn.addEventListener("click", () => {
  const wallet = prompt("Enter your USDT TRC20 wallet:");
  if (!wallet) return;

  let withdraws = JSON.parse(localStorage.getItem("teletech_withdraws")) || [];

  withdraws.push({
    user: myRef || "user",
    wallet,
    amount: balance,
    status: "pending",
    time: Date.now()
  });

  localStorage.setItem("teletech_withdraws", JSON.stringify(withdraws));

  alert("Withdraw request sent (DEMO)");
  balance = 0;
  localStorage.setItem(STORAGE_KEY, balance);
  updateBalance(balance);
});


function updateBalance(val) {
  document.getElementById("balance").innerText = val + " TT";

  const wBtn = document.getElementById("withdrawBtn");
  if (val >= 1000) {
    wBtn.style.display = "block";
  } else {
    wBtn.style.display = "none";
  }
}

init();
// ===== REWARDED ADS (DEMO) =====
const AD_REWARD = 50;
const AD_LIMIT = 10;

const watchAdBtn = document.getElementById("watchAdBtn");
const adModal = document.getElementById("adModal");
const countdownEl = document.getElementById("countdown");
const closeAdBtn = document.getElementById("closeAdBtn");

const ADS_KEY = "teletech_ads";
let adsData = JSON.parse(localStorage.getItem(ADS_KEY)) || {
  count: 0,
  date: new Date().toDateString()
};

// reset daily ads
if (adsData.date !== new Date().toDateString()) {
  adsData = { count: 0, date: new Date().toDateString() };
  localStorage.setItem(ADS_KEY, JSON.stringify(adsData));
}

watchAdBtn.addEventListener("click", () => {
  if (adsData.count >= AD_LIMIT) {
    alert("❌ Daily ad limit reached");
    return;
  }
  playAd();
});

function playAd() {
  let timeLeft = 15;
  adModal.classList.remove("hidden");
  closeAdBtn.disabled = true;
  closeAdBtn.innerText = "Please wait...";
  countdownEl.innerText = timeLeft;

  const timer = setInterval(() => {
    timeLeft--;
    countdownEl.innerText = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      finishAd();
    }
  }, 1000);
}

function finishAd() {
  adsData.count++;
  localStorage.setItem(ADS_KEY, JSON.stringify(adsData));

  balance += AD_REWARD;
  localStorage.setItem(STORAGE_KEY, balance);
  updateBalance(balance);

  closeAdBtn.disabled = false;
  closeAdBtn.innerText = "Close & Claim Reward";

  closeAdBtn.onclick = () => {
    adModal.classList.add("hidden");
    alert(`🎉 You earned +${AD_REWARD} TT`);
  };
}
// ===== REFERRAL SYSTEM (DEMO) =====
const REF_KEY = "teletech_ref";
const MY_REF_KEY = "teletech_my_ref";

// rewards
const REF_INVITER_REWARD = 100;
const REF_NEWUSER_REWARD = 50;

// generate my referral code
let myRef = localStorage.getItem(MY_REF_KEY);
if (!myRef) {
  myRef = Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem(MY_REF_KEY, myRef);
}

// show referral link
const refLinkInput = document.getElementById("refLink");
if (refLinkInput) {
  const baseUrl = window.location.origin + window.location.pathname;
  refLinkInput.value = `${baseUrl}?ref=${myRef}`;
}

// copy button
const copyBtn = document.getElementById("copyRefBtn");
if (copyBtn) {
  copyBtn.onclick = () => {
    refLinkInput.select();
    document.execCommand("copy");
    alert("Referral link copied!");
  };
}

// check incoming referral
const urlParams = new URLSearchParams(window.location.search);
const incomingRef = urlParams.get("ref");

let refData = JSON.parse(localStorage.getItem(REF_KEY)) || {
  used: false,
  inviter: null
};

if (incomingRef && !refData.used && incomingRef !== myRef) {
  // mark referral as used
  refData.used = true;
  refData.inviter = incomingRef;
  localStorage.setItem(REF_KEY, JSON.stringify(refData));

  // reward new user
  balance += REF_NEWUSER_REWARD;
  localStorage.setItem(STORAGE_KEY, balance);
  updateBalance(balance);

  alert(`🎉 Welcome bonus! +${REF_NEWUSER_REWARD} TT`);
}
