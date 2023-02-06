import { TokenData } from "@0xsquid/sdk";
import fetch from "node-fetch";
import db from "../../prisma/db";
import { DatabaseError } from "../types/errors";
import logger from "../utils/Logging/logger";
export class SquidService {
  static isTokenDataSafe(token: TokenData) {
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
  }

  public static async updateTokenList() {
    console.log("...Updating Squid tokens...");
    const response = await fetch("https://api.0xsquid.com/v1/tokens");
    const { tokens }: { tokens: TokenData[] } = await response.json();
    if (!tokens) return;
    for (const token of tokens) {
      if (!this.isTokenDataSafe(token)) continue;
      try {
        const tokenDbEntry = await db.token.findFirst({
          where: {
            address: token.address,
            chainId: Number(token.chainId),
          },
        });
        if (!tokenDbEntry) {
          try {
            if (!token.decimals) continue;
            await db.token.create({
              data: {
                address: token.address,
                chainId: Number(token.chainId),
                logoURI: token.logoURI || "",
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
                protocols: ["squid"],
              },
            });
          } catch (err) {
            logger.error(
              new DatabaseError(`Error creating squid token: ${err}`)
            );
          }
        } else if (!tokenDbEntry.protocols.includes("squid")) {
          try {
            await db.token.update({
              where: {
                address_chainId: {
                  address: token.address,
                  chainId: Number(token.chainId),
                },
              },
              data: {
                protocols: {
                  push: "squid",
                },
              },
            });
          } catch (err) {
            logger.error(
              new DatabaseError(`Error updating squid token: ${err}`)
            );
          }
        }
      } catch (err) {
        logger.error(new DatabaseError(`Error updating squid token: ${err}`));
      }
    }
    console.log("...Finished updating Squid tokens\n");
  }
}
