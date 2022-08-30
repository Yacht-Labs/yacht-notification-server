import { collateralAssets } from "../constants/tokenAddresses";
import db from "../../prisma/db";
import { request } from "graphql-request";
import { getEulerGraphEndpoint, formatAPY } from "../utils/environment";
import BigNumberJs from "bignumber.js";
import logger from "../utils/logger";

interface asset {
  id: string;
  name: string;
  symbol: string;
  decimals: string;
  currPriceUsd: string;
  borrowAPY: string;
  supplyAPY: string;
  interestRate: string;
  config: {
    borrowFactor: string;
    collateralFactor: string;
    tier: string;
  };
}

const initTokenDb = async () => {
  collateralAssets.forEach(async (collateralAsset) => {
    const tokenQuery = `
      {
        asset(id: "${collateralAsset.address}") {
          id
          name
          symbol
          decimals
          currPriceUsd
          borrowAPY
          supplyAPY
          interestRate
          config {
            borrowFactor
            collateralFactor
            tier
          }
        }
      }
    `;
    try {
      const { asset }: { asset: asset } = await request(
        getEulerGraphEndpoint(),
        tokenQuery
      );
      const tokenData = {
        address: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        decimals: parseInt(asset.decimals),
        price: new BigNumberJs(asset.currPriceUsd)
          .dividedBy(new BigNumberJs("10e17"))
          .toString(),
      };
      const eulerTokenData = {
        address: asset.id,
        tokenId: asset.id,
        borrowAPY: formatAPY(asset.borrowAPY),
        supplyAPY: formatAPY(asset.supplyAPY),
        borrowFactor: new BigNumberJs(asset.config.borrowFactor)
          .dividedBy(new BigNumberJs("4e9"))
          .toNumber(),
        collateralFactor: new BigNumberJs(asset.config.collateralFactor)
          .dividedBy(new BigNumberJs("4e9"))
          .toNumber(),
        tier: asset.config.tier,
        eulAPY: 0.0,
      };
      try {
        await db.token.create({
          data: {
            ...tokenData,
          },
        });
        await db.eulerToken.create({
          data: {
            ...eulerTokenData,
          },
        });
      } catch (err) {
        logger.error(`Database error: ${err}`);
        process.exit(1);
      }
    } catch (err) {
      logger.error(`Euler graph error: ${err}`);
      process.exit(1);
    }
  });
};

initTokenDb();
