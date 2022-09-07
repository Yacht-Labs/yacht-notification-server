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
import {
  DatabaseResult,
  GraphResult,
  ProviderResult,
} from "../../types/results";
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

const getEulerTopLevelAccountId = async (
  subAccount: string
): Promise<GraphResult<string>> => {
  const query = `{
    account(id: "${subAccount.toLowerCase()}") {
      topLevelAccount{
        id
      }
    }
  }`;
  try {
    const {
      account: {
        topLevelAccount: { id },
      },
    } = await request(getEulerGraphEndpoint(), query);
    return id;
  } catch (err) {
    return new GraphError(getErrorMessage(err));
  }
};

interface EulerAccountBalance {
  amount: string;
  asset: {
    id: string;
  };
}

interface EulerTopLevelAccount {
  topLevelAccount: {
    accounts: { id: string; balances: EulerAccountBalance[] }[];
  };
}

router.get("/account/:address", async (req, res) => {
  const { address }: { address: string } = req.params;
  const topLevelAccountId = await getEulerTopLevelAccountId(address);
  if (topLevelAccountId instanceof GraphError) {
    return res.sendStatus(500);
  }
  const query = `{
    topLevelAccount(id: "${topLevelAccountId.toLowerCase()}") {
        accounts {
          id
          balances {
            amount
            asset {
              id
            }
          }
      }
    }
  }`;
  try {
    const {
      topLevelAccount: { accounts },
    }: EulerTopLevelAccount = await request(getEulerGraphEndpoint(), query);
    const accountInfo: {
      subAccountId: string;
      supplies: { token: EulerToken & Token; amount: string }[];
      borrows: { token: EulerToken & Token; amount: string }[];
      healthScore: ProviderResult<number>;
    }[] = [];
    for (const account of accounts) {
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
      console.log("Account ID: ", account.id);
      const healthScore = await getHealthScoreByAddress(account.id);
      if (healthScore instanceof ProviderError) {
        logger.error(healthScore.message);
        res.sendStatus(500);
      }
      accountInfo.push({
        subAccountId: account.id,
        supplies,
        borrows,
        healthScore,
      });
    }
    return res.json(accountInfo);
  } catch (err) {
    const graphError = new GraphError(getErrorMessage(err));
    return res.sendStatus(500);
  }
});

router.get("/tokens", async (req, res) => {
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

router.get("/tokens/:address", async (req, res) => {
  const { address } = req.params;
  const eulerTokenData = await getEulerTokenDataByAddress(address);
  if (eulerTokenData instanceof DatabaseError) {
    return res.sendStatus(500);
  }
  return res.json(eulerTokenData);
});

export default router;
