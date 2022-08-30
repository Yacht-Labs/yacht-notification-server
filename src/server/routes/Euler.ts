import {
  getEulerGraphEndpoint,
  getEulerSimpleLens,
  getProviderUrl,
} from "./../../utils/environment";
import express from "express";
import db from "../../../prisma/db";
import { request } from "graphql-request";
import { BigNumber, ethers } from "ethers";
import * as eulerLensContract from "../../constants/abis/eulerLens.json";
import BigNumberJs from "bignumber.js";
import { DatabaseResult, ProviderResult } from "../../types/results";
import { DatabaseError, GraphError, ProviderError } from "../../types/errors";
import { getErrorMessage } from "../../utils/getErrorMessage";
import logger from "../../utils/logger";
import { EulerToken, Token } from "@prisma/client";

const router = express.Router();

// TODO: consolidate with the method in the eulernotification
export const getHealthScoreByAddress = async (
  address: string
): Promise<ProviderResult<number>> => {
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
    return new ProviderError(getErrorMessage(err));
  }
};

const getEulerTokenDataByAddress = async (
  address: string
): Promise<DatabaseResult<EulerToken & Token>> => {
  try {
    const tokenData = await db.token.findUnique({
      where: { address },
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

interface EulerAccountBalance {
  balances: {
    amount: string;
    asset: {
      id: string;
      name: string;
    };
  }[];
}

router.get("/account/:address", async (req, res) => {
  const { address }: { address: string } = req.params;
  const query = `{
    account(id: "${address.toLowerCase()}") {
      balances {
        amount
        asset {
          id
          name
        }
      }
    }
  }`;
  try {
    const { account }: { account: EulerAccountBalance } = await request(
      getEulerGraphEndpoint(),
      query
    );
    const supplies: { token: EulerToken & Token; amount: string }[] = [];
    const borrows: { token: EulerToken & Token; amount: string }[] = [];
    account.balances.forEach(async (balance) => {
      const tokenData = await getEulerTokenDataByAddress(balance.asset.id);
      if (tokenData instanceof DatabaseError) {
        return res.sendStatus(500);
      }
      if (balance.amount[0] === "-") {
        borrows.push({
          token: tokenData,
          amount: new BigNumberJs(balance.amount.substring(1))
            .dividedBy(new BigNumberJs("10e17"))
            .toString(),
        });
      } else {
        supplies.push({
          token: tokenData,
          amount: new BigNumberJs(balance.amount)
            .dividedBy(new BigNumberJs("10e17"))
            .toString(),
        });
      }
    });
    const healthScore: ProviderResult<number> = await getHealthScoreByAddress(
      address
    );
    if (healthScore instanceof ProviderError) {
      return res.sendStatus(500);
    }
    return res.json({
      supplies,
      borrows,
      healthScore,
    });
  } catch (err) {
    const graphError = new GraphError(getErrorMessage(err));
    return res.sendStatus(500);
  }
});

router.get("/tokens", async (req, res) => {
  try {
    const tokenData = await db.token.findMany();
    const eulerTokenData = await db.eulerToken.findMany();
    const combinedTokenData = tokenData.map((token) => {
      const matchedToken = eulerTokenData.find(
        (eulerToken) => eulerToken.address === token.address
      );
      return {
        ...token,
        ...matchedToken,
      };
    });
    res.json(combinedTokenData);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    res.sendStatus(500);
  }
});

router.get("/tokens/:address", async (req, res) => {
  const { address } = req.params;
  const eulerTokenData = await getEulerTokenDataByAddress(address);
  if (eulerTokenData instanceof DatabaseError) {
    return res.sendStatus(500);
  }
  return res.json(eulerTokenData);
});

export default router;
