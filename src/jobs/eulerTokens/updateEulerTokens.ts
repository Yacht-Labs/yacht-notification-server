import db from "../../../prisma/db";
import { gql, request } from "graphql-request";
import { getEulerGraphEndpoint, formatAPY } from "../../utils/environment";
import BigNumberJs from "bignumber.js";
import logger from "../../utils/logger";

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

export const updateEulerTokens = async () => {
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
  } catch (err) {
    logger.error(`Euler graph error: ${err}`);
    process.exit(1);
  }
};
