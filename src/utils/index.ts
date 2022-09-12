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
  // console.log({ primary });
  // console.log({ subAccount });
  return Number(
    utils.hexZeroPad(BigNumber.from(primary).xor(subAccount).toHexString(), 20)
  );
}
