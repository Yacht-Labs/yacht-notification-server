import { formatAPY, getEulerGraphEndpoint } from "./../utils/environment";
import request, { gql } from "graphql-request";
import { collateralAssets } from "../constants/tokenAddresses";
import db from "../../prisma/db";
import BigNumberJs from "bignumber.js";

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
  });
  console.log("...Finished updating token data....");
};
