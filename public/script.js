// ==========================
// CREATE / GET USER ID
// ==========================
let userId = localStorage.getItem("uid");

if (!userId) {
  userId = "user_" + Math.floor(Math.random() * 1000000000);
  localStorage.setItem("uid", userId);
}

// ==========================
// LOAD USER DATA
// ==========================
async function loadUser() {
  try {
    const res = await fetch("/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    document.getElementById("balance").innerText = data.balance + " TT";
  } catch (err) {
    console.error(err);
  }
}

// ==========================
// TAP FUNCTION
// ==========================
async function tap() {
  try {
    const res = await fetch("/tap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    document.getElementById("balance").innerText = data.balance + " TT";
  } catch (err) {
    console.error(err);
  }
}

// Load on page start
window.onload = loadUser;
