import { TonClient, WalletContractV4, internal } from "ton";
import { mnemonicToPrivateKey } from "ton-crypto";
import { JettonMinter, JettonWallet } from "ton-jetton";

export async function sendJetton(toAddress, amount) {
  const mnemonic = process.env.TON_MNEMONIC.split(" ");
  const keyPair = await mnemonicToPrivateKey(mnemonic);

  const client = new TonClient({
    endpoint: process.env.TON_RPC
  });

  const wallet = WalletContractV4.create({
    publicKey: keyPair.publicKey,
    workchain: 0,
  });

  const walletContract = client.open(wallet);

  const jettonMinter = client.open(
    JettonMinter.createFromAddress(process.env.TOKEN_CONTRACT)
  );

  const jettonWallet = await jettonMinter.getWallet(wallet.address);

  const transferAmount = BigInt(amount) * 10n ** 9n;

  await walletContract.sendTransfer({
    secretKey: keyPair.secretKey,
    seqno: await walletContract.getSeqno(),
    messages: [
      internal({
        to: jettonWallet.address,
        value: "0.05",
        body: JettonWallet.createTransferBody({
          to: toAddress,
          jettonAmount: transferAmount,
          forwardAmount: "0.01",
          responseAddress: wallet.address
        })
      })
    ]
  });

  return true;
}
