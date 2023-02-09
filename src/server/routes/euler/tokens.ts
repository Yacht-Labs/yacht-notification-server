import { getEulerSimpleLens, getProviderUrl } from "../../../utils/environment";
import express from "express";
import db from "../../../../prisma/db";
import { BigNumber, ethers } from "ethers";
import * as eulerLensContract from "../../../constants/abis/eulerLens.json";
import { DatabaseResult, ProviderResult } from "../../../types/results";
import { DatabaseError, ProviderError } from "../../../types/errors";
import { getErrorMessage } from "../../../utils/";
import logger from "../../../utils/Logging/logger";
import { EulerToken, Token } from "@prisma/client";

const router = express.Router();

const getEulerTokenDataByAddress = async (
  address: string
): Promise<DatabaseResult<EulerToken & Token>> => {
  try {
    const tokenData = await db.token.findUnique({
      where: {
        address_chainId: {
          address,
          chainId: 1,
        },
      },
    });
    const eulerTokenData = await db.eulerToken.findUnique({
      where: { address },
    });
    if (!tokenData || !eulerTokenData) {
      return new DatabaseError(`Missing token for address: ${address}`);
    }
    return {
      ...tokenData,
      ...eulerTokenData,
    };
  } catch (err) {
    return new DatabaseError(getErrorMessage(err));
  }
};

router.get("/", async (req, res) => {
  try {
    const eulerTokenData = await db.eulerToken.findMany({
      include: {
        token: {
          select: {
            name: true,
            symbol: true,
            price: true,
            decimals: true,
            logoURI: true,
          },
        },
      },
    });
    const formattedTokenInfo = eulerTokenData.map((eulerToken) => {
      // Flatten the object
      const { token, ...eulerData } = eulerToken;
      return { ...token, ...eulerData };
    });
    const sortedTokens = formattedTokenInfo.sort(
      (a, b) =>
        parseFloat(b.totalSupplyUSD || "0") -
        parseFloat(a.totalSupplyUSD || "0")
    );
    res.json(sortedTokens);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    res.sendStatus(500);
  }
});

router.get("/:address", async (req, res) => {
  const { address } = req.params;
  const eulerTokenData = await getEulerTokenDataByAddress(address);
  if (eulerTokenData instanceof DatabaseError) {
    return res.sendStatus(500);
  }
  return res.json(eulerTokenData);
});

export default router;
