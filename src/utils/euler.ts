import { utils, BigNumber } from "ethers";

export function getSubAccount(primary: string, subAccountId: number) {
  if (subAccountId > 256) throw `invalid subAccountId: ${subAccountId}`;
  return utils.hexZeroPad(
    BigNumber.from(primary).xor(subAccountId).toHexString(),
    20
  );
}

export function getSubAccountIdFromAccount(
  primary: string,
  subAccount: string
) {
  return Number(
    utils.hexZeroPad(BigNumber.from(primary).xor(subAccount).toHexString(), 20)
  );
}

export const formatAPY = (rawAPY: string): number => {
  if (rawAPY === "0") return 0;
  const diff = rawAPY.length - 26;
  if (diff === 0) {
    return parseFloat(rawAPY[0] + "." + rawAPY.slice(1, 3));
  }
  if (diff < 0) {
    return parseFloat(
      "." + "0".repeat(Math.abs(diff) - 1) + rawAPY.slice(0, 3 + diff)
    );
  }
  return parseFloat(
    rawAPY.slice(0, diff + 1) +
      (diff < 3 ? `.${rawAPY.slice(diff + 1, 3)}` : "")
  );
};
