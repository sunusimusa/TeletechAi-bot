/* =====================================================
   WALLET – FINAL CLEAN
   SERVER = SOURCE OF TRUTH
   NO localStorage
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  loadWallet();
});

/* ================= LOAD WALLET ================= */
async function loadWallet() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include" // 🍪 session cookie
    });

    const data = await res.json();

    if (!data.success) {
      deny();
      return;
    }

    showApp();

    document.getElementById("walletAddress").value = data.wallet;
    document.getElementById("balance").innerText = data.balance;
    document.getElementById("tokens").innerText = data.tokens;

  } catch (e) {
    deny();
  }
}

/* ================= CONVERT ================= */
async function convert() {
  try {
    const res = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: 10000 })
    });

    const data = await res.json();

    if (!data.success) {
      alert("❌ " + (data.error || "Conversion failed"));
      return;
    }

    document.getElementById("balance").innerText = data.balance;
    document.getElementById("tokens").innerText = data.tokens;

    alert("✅ Converted successfully");

  } catch (e) {
    alert("❌ Network error");
  }
}

/* ================= HELPERS ================= */
function copyWallet() {
  const input = document.getElementById("walletAddress");
  input.select();
  document.execCommand("copy");
  alert("✅ Wallet copied");
}

function deny() {
  document.getElementById("denied").classList.remove("hidden");
}

function showApp() {
  document.getElementById("app").classList.remove("hidden");
}

function backToGame() {
  location.href = "/";
}
