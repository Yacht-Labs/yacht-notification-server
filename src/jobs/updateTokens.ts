import { formatAPY, getEulerGraphEndpoint } from "./../utils/environment";
import request, { gql } from "graphql-request";
import { collateralAssets } from "../constants/tokenAddresses";
import db from "../../prisma/db";
import BigNumberJs from "bignumber.js";
import logger from "../utils/logger";

export const updateAPYs = async () => {
  console.log("...Updating token data....");
  collateralAssets.forEach(async (collateralAsset) => {
    const tokenQuery = `
    {
      asset(id: "${collateralAsset.address}") {
        id
        borrowAPY
        supplyAPY
        currPriceUsd
      }
    }
  `;
    try {
      const {
        asset,
      }: {
        asset: {
          id: string;
          borrowAPY: string;
          supplyAPY: string;
          currPriceUsd: string;
        };
      } = await request(getEulerGraphEndpoint(), tokenQuery, {
        tokenAddress: collateralAsset.address,
      });
      const borrowAPY = formatAPY(asset.borrowAPY);
      const supplyAPY = formatAPY(asset.supplyAPY);
      const price = new BigNumberJs(asset.currPriceUsd)
        .dividedBy(new BigNumberJs("10e17"))
        .toString();
      try {
        await db.eulerToken.update({
          where: { address: collateralAsset.address },
          data: {
            borrowAPY,
            supplyAPY,
          },
        });
        await db.token.update({
          where: { address: collateralAsset.address },
          data: {
            price,
          },
        });
      } catch (err) {
        logger.error(`Database error: ${err}`);
      }
    } catch (err) {
      logger.error(`Euler graph error: ${err}`);
    }
  });
  console.log("...Finished updating token data....");
};
