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

const router = express.Router();

const getHealthScoreByAddress = async (address: string): Promise<number> => {
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
};

const getEulerTokenDataByAddress = async (address: string) => {
  const tokenData = await db.token.findUnique({
    where: { address },
  });
  const eulerTokenData = await db.eulerToken.findUnique({
    where: { address },
  });
  return {
    ...tokenData,
    ...eulerTokenData,
  };
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
  const { address } = req.params;
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
  const { account }: { account: EulerAccountBalance } = await request(
    getEulerGraphEndpoint(),
    query
  );
  const loans: any[] = [];
  const borrows: any[] = [];
  account.balances.forEach(async (balance) => {
    const tokenData = await getEulerTokenDataByAddress(balance.asset.id);
    if (balance.amount[0] === "-") {
      borrows.push({
        token: tokenData,
        amount: new BigNumberJs(balance.amount.substring(1)).dividedBy(
          new BigNumberJs("10e17").toString()
        ),
      });
    } else {
      loans.push({
        token: tokenData,
        amount: new BigNumberJs(balance.amount).dividedBy(
          new BigNumberJs("10e17").toString()
        ),
      });
    }
  });
  const healthScore = await getHealthScoreByAddress(address);
  res.json({
    loans,
    borrows,
    healthScore,
  });
});

router.get("/tokens", async (req, res) => {
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
});

router.get("/tokens/:address", async (req, res) => {
  const { address } = req.params;
  res.json(await getEulerTokenDataByAddress(address));
});

export default router;
