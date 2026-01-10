/* ================= INIT WALLET ================= */
const userId = localStorage.getItem("userId") || "SUNUSI_001";

function initWallet(){
  let wallet = localStorage.getItem("wallet");
  if(!wallet){
    wallet = "TTECH-" + Math.random().toString(36).substring(2,8).toUpperCase();
    localStorage.setItem("wallet", wallet);
  }

  if(!localStorage.getItem("tokens")){
    localStorage.setItem("tokens", "10"); // start tokens
  }

  document.getElementById("myWallet").innerText = wallet;
  document.getElementById("myTokens").innerText =
    localStorage.getItem("tokens");
}

initWallet();

/* ================= SEND TOKENS ================= */
function sendTokens(){
  const toWallet = document.getElementById("toWallet").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const msg = document.getElementById("sendMsg");

  let tokens = Number(localStorage.getItem("tokens"));

  if(!toWallet || amount <= 0){
    msg.innerText = "❌ Invalid input";
    return;
  }

  if(tokens < amount){
    msg.innerText = "❌ Not enough tokens";
    return;
  }

  tokens -= amount;
  localStorage.setItem("tokens", tokens);

  document.getElementById("myTokens").innerText = tokens;
  msg.innerText = `✅ Sent ${amount} tokens to ${toWallet}`;
}

/* ================= WITHDRAW ================= */
function withdraw(){
  const amount = Number(document.getElementById("withdrawAmount").value);
  const msg = document.getElementById("withdrawMsg");

  let tokens = Number(localStorage.getItem("tokens"));

  if(amount <= 0){
    msg.innerText = "❌ Invalid amount";
    return;
  }

  if(tokens < amount){
    msg.innerText = "❌ Not enough tokens";
    return;
  }

  tokens -= amount;
  localStorage.setItem("tokens", tokens);

  document.getElementById("myTokens").innerText = tokens;
  msg.innerText = "⏳ Withdrawal pending (demo mode)";
}
