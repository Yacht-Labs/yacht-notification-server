import { getProviderUrl } from "./../../../utils/environment";
import { YachtLitSdk } from "lit-swap-sdk";
import { getMumbaiPrivateKey } from "../../../utils";
import { ethers } from "ethers";

const mumbaiPrivateKey = getMumbaiPrivateKey();
const mumbaiProvider = getProviderUrl(80001);

const signer = new ethers.Wallet(
  mumbaiPrivateKey,
  new ethers.providers.JsonRpcProvider(mumbaiProvider)
);

const litSdk = new YachtLitSdk(signer);

export default litSdk;
