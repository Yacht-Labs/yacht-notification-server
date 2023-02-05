import { isEvmAddress } from "./../utils/evm";
import { getEulerTokenEndpoint } from "./../utils/environment";
import { DatabaseError, HttpError, ProviderError } from "./../types/errors";
import { BigNumber, ethers, utils } from "ethers";
import {
  getEulerGraphEndpoint,
  getEulerSimpleLens,
  getProviderUrl,
} from "../utils/environment";
import * as eulerLensContract from "../constants/abis/eulerLens.json";
import { getErrorMessage } from "../utils/errors";
import { TokenInfo } from "../types/Euler";
import fetch from "node-fetch";
import db from "../../prisma/db";
import logger from "../utils/Logging/logger";
import { gql, request } from "graphql-request";
import BigNumberJs from "bignumber.js";
import { formatAPY } from "../utils";

export interface asset {
  id: string;
  currPriceUsd: string;
  decimals: string;
  borrowAPY: string;
  supplyAPY: string;
  totalBalances: string;
  totalBorrows: string;
  config: {
    borrowFactor: string;
    collateralFactor: string;
    tier: string;
  };
}

export class EulerService {
  public static async updateTokenList() {
    const isTokenDataSafe = (token: TokenInfo) => {
      if (!token.chainId || Number.isNaN(Number(token.chainId))) {
        return false;
      }
      if (!token.address || typeof token.address !== "string") {
        return false;
      }
      if (!token.name || typeof token.name !== "string") {
        return false;
      }
      if (!token.symbol || typeof token.symbol !== "string") {
        return false;
      }
      if (!token.decimals || Number.isNaN(Number(token.decimals))) {
        return false;
      }
      return true;
    };

    try {
      console.log("...Updating Euler tokens...");
      const response = await fetch(getEulerTokenEndpoint());
      const { tokens }: { tokens: TokenInfo[] } = await response.json();
      if (!tokens) return;
      for (const token of tokens) {
        if (!isTokenDataSafe(token)) continue;
        const tokenDbEntry = await db.token.findFirst({
          where: {
            address: token.address,
            chainId: token.chainId,
          },
        });
        if (!tokenDbEntry) {
          try {
            await db.token.create({
              data: {
                address: token.address,
                chainId: Number(token.chainId),
                logoURI: token.logoURI,
                name: token.name,
                symbol: token.symbol,
                decimals: Number(token.decimals),
                extensions: token.extensions,
                protocols: ["euler"],
              },
            });
          } catch (err) {
            logger.error(new DatabaseError(`Error creating token: ${err}`));
          }
        } else if (!tokenDbEntry.protocols.includes("euler")) {
          try {
            await db.token.update({
              where: {
                id: tokenDbEntry.id,
              },
              data: {
                protocols: [...tokenDbEntry.protocols, "euler"],
              },
            });
          } catch (err) {
            logger.error(
              new DatabaseError(`Error updating Euler token: ${err}`)
            );
          }
        }
      }
      console.log("...Finished updating Euler tokens\n");
    } catch (err) {
      logger.error(new HttpError(`Error updating Euler tokens: ${err}`));
    }
  }

  public static async updateEulerTokens() {
    const isAssetSafe = (asset: asset) => {
      if (!asset.id || typeof asset.id !== "string") {
        return false;
      }
      if (!asset.currPriceUsd || typeof asset.currPriceUsd !== "string") {
        return false;
      }
      if (!asset.borrowAPY || typeof asset.borrowAPY !== "string") {
        return false;
      }
      if (!asset.supplyAPY || typeof asset.supplyAPY !== "string") {
        return false;
      }
      if (!asset.decimals || Number.isNaN(Number(asset.decimals))) {
        return false;
      }
      if (!asset.totalBalances || typeof asset.totalBalances !== "string") {
        return false;
      }
      if (!asset.totalBorrows || typeof asset.totalBorrows !== "string") {
        return false;
      }
      if (!asset.config) {
        return false;
      }
      if (
        !asset.config.borrowFactor ||
        typeof asset.config.borrowFactor !== "string"
      ) {
        return false;
      }
      if (
        !asset.config.collateralFactor ||
        typeof asset.config.collateralFactor !== "string"
      ) {
        return false;
      }
      if (!asset.config.tier || typeof asset.config.tier !== "string") {
        return false;
      }
      return true;
    };
    console.log("...Updating Euler Tokens With Euler Data...");
    const tokenQuery = gql`
      query {
        assets {
          id
          currPriceUsd
          borrowAPY
          supplyAPY
          totalBalances
          totalBorrows
          config {
            borrowFactor
            collateralFactor
            tier
          }
        }
      }
    `;
    try {
      const { assets }: { assets: asset[] } = await request(
        getEulerGraphEndpoint(),
        tokenQuery
      );
      console.log({ assets });
      if (!assets) return;
      for (const asset of assets) {
        console.log({ asset });
        if (!isAssetSafe(asset)) continue;
        const price = new BigNumberJs(asset.currPriceUsd)
          .dividedBy(new BigNumberJs("10e17"))
          .toString();
        const eulerTokenData = {
          totalSupplyUSD: new BigNumberJs(asset.totalBalances)
            .dividedBy(
              new BigNumberJs(`10e${(parseInt(asset.decimals) - 1).toString()}`)
            )
            .multipliedBy(new BigNumberJs(price))
            .toFixed(),
          totalBorrowsUSD: new BigNumberJs(asset.totalBorrows)
            .dividedBy(
              new BigNumberJs(`10e${(parseInt(asset.decimals) - 1).toString()}`)
            )
            .multipliedBy(new BigNumberJs(price))
            .toFixed(),
          borrowAPY: formatAPY(asset.borrowAPY),
          supplyAPY: formatAPY(asset.supplyAPY),
          borrowFactor: asset.config
            ? new BigNumberJs(asset.config.borrowFactor)
                .dividedBy(new BigNumberJs("4e9"))
                .toNumber()
            : 0,
          collateralFactor: asset.config
            ? new BigNumberJs(asset.config.collateralFactor)
                .dividedBy(new BigNumberJs("4e9"))
                .toNumber()
            : 0,
          tier: asset.config?.tier ?? "isolated",
          eulAPY: 0.0,
        };
        try {
          console.log("----HERE----");
          const tokenExists = await db.token.findFirst({
            where: {
              address: asset.id,
              chainId: 1,
            },
          });
          if (tokenExists) {
            const tokenData = await db.token.update({
              where: {
                address_chainId: {
                  address: asset.id,
                  chainId: 1,
                },
              },
              data: {
                price,
              },
            });
            await db.eulerToken.upsert({
              where: {
                address: asset.id,
              },
              update: {
                ...eulerTokenData,
              },
              create: {
                tokenId: tokenData.id,
                address: asset.id,
                ...eulerTokenData,
              },
            });
          }
        } catch (err) {
          logger.error(`Database error: ${err}`);
        }
      }
      console.log("...Finished updating Euler tokens with Euler Data...\n");
    } catch (err) {
      logger.error(`Euler graph error: ${err}`);
    }
  }

  public static async getHealthScoreByAddress(
    address: string
  ): Promise<number> {
    try {
      const provider = new ethers.providers.JsonRpcProvider(getProviderUrl(1));
      const eulerLens = new ethers.Contract(
        getEulerSimpleLens(),
        eulerLensContract.abi,
        provider
      );
      const { healthScore }: { healthScore: BigNumber } =
        await eulerLens.getAccountStatus(address);
      return parseFloat(ethers.utils.formatEther(healthScore));
    } catch (err) {
      throw new ProviderError(err);
    }
  }

  public static getSubAccountAddressFromAccount(
    primary: string,
    subAccountId: string
  ) {
    if (isEvmAddress(primary)) {
      return utils.hexZeroPad(
        BigNumber.from(primary).xor(subAccountId).toHexString(),
        20
      );
    }
    throw new Error(`Invalid primary address: ${primary}`);
  }
}
