import { TokenInfo } from "./../types/Euler";
import db from "../../prisma/db";
import logger from "../utils/logger";
import fetch from "node-fetch";

export const updateTokenList = async () => {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/euler-xyz/euler-tokenlist/master/euler-tokenlist.json"
    );
    const { tokens } = await response.json();
    tokens.forEach(async (token: TokenInfo) => {
      const tokenDbEntry = await db.token.findFirst({
        where: {
          address: token.address,
          chainId: token.chainId,
        },
      });
      if (!tokenDbEntry) {
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
      }
    });
  } catch (err) {
    logger.error(err);
  }
};

updateTokenList();
