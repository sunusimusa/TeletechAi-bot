// ton.js
require("dotenv").config();

// ⚠️ TEMP MOCK TON TRANSFER
// Wannan yana hana error har sai ka shirya real TON transfer

async function sendJetton(wallet, amount) {
  console.log("🚀 Simulated TON transfer");
  console.log("To Wallet:", wallet);
  console.log("Amount:", amount);

  // nan gaba zaka saka TON SDK
  return {
    success: true,
    txId: "TEST_TX_" + Date.now()
  };
}

module.exports = {
  sendJetton
};
