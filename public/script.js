// ==========================
// USER ID
// ==========================
let userId = localStorage.getItem("uid");

if (!userId) {
  userId = Math.floor(Math.random() * 1000000);
  localStorage.setItem("uid", userId);
}

// ==========================
// LOAD USER
// ==========================
async function loadUser() {
  const res = await fetch("/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// ==========================
// TAP FUNCTION
// ==========================
async function tap() {
  const res = await fetch("/tap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();

  document.getElementById("balance").innerText = data.balance;
  document.getElementById("energy").innerText = data.energy;
}

// ==========================
// REFERRAL LINK
// ==========================
document.getElementById("refLink").value =
  window.location.origin + "?ref=" + userId;

// ==========================
// LOAD REF COUNT
// ==========================
async function loadRefCount() {
  const res = await fetch("/ref-count", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  document.getElementById("refCount").innerText =
    "Referrals: " + data.count;
}

// ==========================
// ON LOAD
// ==========================
loadUser();
loadRefCount();
