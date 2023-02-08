import { create } from "ipfs-core";
import db from "../prisma/db";
import litSdk from "../src/server/routes/lit/sdk";

const tokenAAddress = "0xBA62BCfcAaFc6622853cca2BE6Ac7d845BC0f2Dc"; // FAU TOKEN
const tokenBAddress = "0xeDb95D8037f769B72AAab41deeC92903A98C9E16"; // TEST TOKEN

const chainAParams = {
  counterPartyAddress: "0xe1b89ef648a6068fb4e7bcd943e3a9f4dc5c530b",
  tokenAddress: tokenAAddress,
  chain: "goerli",
  amount: "16",
  decimals: 18,
};

const chainBParams = {
  counterPartyAddress: "0x38c3a84293f9079dec28573cd3f1e8a995b0b500",
  tokenAddress: tokenBAddress,
  chain: "mumbai",
  amount: "8",
  decimals: 18,
};

const litActionCode = litSdk.createERC20SwapLitAction(
  chainAParams,
  chainBParams,
  new Date().getTime() - 4 * 24 * 60 * 60 * 1000
);
(async () => {
  const ipfs = await create({ start: false, offline: true });
  const ipfsCID = (
    await ipfs.add(litActionCode, { onlyHash: true })
  ).cid.toString();
  const pkpInfo = await litSdk.mintGrantBurnWithLitAction(ipfsCID);
  const pkpInfoUpdate = { ...pkpInfo, pkpPublicKey: pkpInfo.publicKey };
  await db.litPkpSwap.create({
    data: {
      chainAParams: JSON.stringify(chainAParams),
      chainBParams: JSON.stringify(chainBParams),
      ipfsCID,
      pkpPublicKey: pkpInfoUpdate.pkpPublicKey,
      address: pkpInfoUpdate.address,
    },
  });
})();
