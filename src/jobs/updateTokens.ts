import { TokenInfo } from "./../types/Euler";
import db from "../../prisma/db";
import logger from "../utils/Logging/logger";
import fetch from "node-fetch";

export const updateTokenList = async () => {
  try {
    logger.info("...Updating all tokens...");
    const response = await fetch(
      "https://raw.githubusercontent.com/euler-xyz/euler-tokenlist/master/euler-tokenlist.json"
    );
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
    logger.info("...Finished updating all tokens\n");
  } catch (err) {
    logger.error(err);
  }
};
