import { ProviderError } from "./../types/errors";
import { BigNumber, ethers } from "ethers";
import { getEulerSimpleLens, getProviderUrl } from "../utils/environment";
import * as eulerLensContract from "../constants/abis/eulerLens.json";
import { getErrorMessage } from "../utils/errors";

export class EulerService {
  constructor() {}
  public static async getHealthScoreByAddress(
    address: string
  ): Promise<number> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        getProviderUrl(1) // mainnet
      );
      const eulerLens = new ethers.Contract(
        getEulerSimpleLens(),
        eulerLensContract.abi,
        provider
      );
      const { healthScore }: { healthScore: BigNumber } =
        await eulerLens.getAccountStatus(address);
      return parseFloat(ethers.utils.formatEther(healthScore));
    } catch (err) {
      throw new ProviderError(getErrorMessage(err));
    }
  }
}
