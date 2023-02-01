import { getEulerTokenEndpoint } from "./../utils/environment";
import { ProviderError } from "./../types/errors";
import { BigNumber, ethers } from "ethers";
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

interface asset {
  id: string;
  name: string;
  symbol: string;
  decimals: string;
  currPriceUsd: string;
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
    try {
      console.log("...Updating all tokens...");
      const response = await fetch(getEulerTokenEndpoint());
      const { tokens }: { tokens: TokenInfo[] } = await response.json();
      for (const token of tokens) {
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
                chainId: token.chainId,
                logoURI: token.logoURI,
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                extensions: token.extensions,
              },
            });
          } catch (err) {
            logger.error(err);
          }
        }
      }
      console.log("...Finished updating all tokens\n");
    } catch (err) {
      logger.error(err);
    }
  }

  public static async updateEulerTokens() {
    console.log("...Updating Euler Tokens...");
    const tokenQuery = gql`
      query {
        assets {
          id
          currPriceUsd
          borrowAPY
          decimals
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
      for (const asset of assets) {
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
          process.exit(1);
        }
      }
      console.log("...Finished updating Euler tokens...\n");
    } catch (err) {
      logger.error(`Euler graph error: ${err}`);
      process.exit(1);
    }
  }

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
