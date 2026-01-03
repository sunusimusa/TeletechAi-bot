import { tonweb, wallet, keyPair } from "./ton.js";

const jettonMinter = new tonweb.token.jetton.JettonMinter(
  tonweb.provider,
  { address: process.env.JETTON_MASTER }
);

export { jettonMinter };
