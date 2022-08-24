import { PrismaClient } from "@prisma/client";
import { request, gql } from "graphql-request";
import { BigNumber, ethers } from "ethers";
import { collateralAssets } from "./../constants/tokenAddresses";
import * as eulerLensContract from "../constants/abis/eulerLens.json";
const APIURL =
  "https://api.thegraph.com/subgraphs/name/euler-xyz/euler-mainnet";

// console.log("work");
// request(APIURL, tokenQuery).then(({ asset }) => {
//   console.log(asset);
//   const borrowAPY = asset.borrowAPY[0] + "." + asset.borrowAPY.slice(1, 3);
//   console.log(borrowAPY);
// });

const tokenQuery = gql`
  {
    asset(id: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2") {
      id
      name
      borrowAPY
      supplyAPY
    }
  }
`;
const prisma = new PrismaClient();

const updateAPYs = async () => {
  const formatAPY = (rawAPY: string): number => {
    return parseInt(rawAPY[0] + "." + rawAPY.slice(1, 3));
  };
  const tokenQuery = gql`
    {
      asset(id: $tokenAddress) {
        id
        name
        borrowAPY
        supplyAPY
      }
    }
  `;
  collateralAssets.forEach(async (collateralAsset) => {
    const {
      asset,
    }: {
      asset: {
        id: string;
        borrowAPY: string;
        supplyAPY: string;
        name: string;
      };
    } = await request(APIURL, tokenQuery, {
      tokenAddress: collateralAsset.address,
    });
    const borrowAPY = formatAPY(asset.borrowAPY);
    const supplyAPY = formatAPY(asset.supplyAPY);
    await prisma.token.update({
      where: { address: collateralAsset.address },
      data: {
        borrowAPY,
        supplyAPY,
      },
    });
  });
};

const sendIRNotification = async () => {
  const notifications = await prisma.eulerIRNotification.findMany({
    where: { isActive: true },
  });
  notifications.forEach(async (notification) => {
    try {
      const { borrowAPY, supplyAPY } = await prisma.token.findFirstOrThrow({
        where: { address: notification.tokenAddress },
      });
      if (notification.borrowAPY && notification.borrowThreshold) {
        const diff = Math.abs(borrowAPY - notification.borrowAPY);
        if (diff > notification.borrowThreshold / 100) {
          // construct notification
        }
      }
      if (notification.supplyAPY && notification.supplyThreshold) {
        const diff = Math.abs(borrowAPY - notification.supplyAPY);
        if (diff > notification.supplyThreshold / 100) {
          // construct notification
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
};

const sendHealthNotifications = async () => {
  const healthNotifications = await prisma.eulerHealthNotification.findMany({
    where: { isActive: true },
  });
  healthNotifications.forEach(async (notification) => {
    const healthScore = await getHealthScoreByAddress(
      notification.addressPubKey
    );
    if (healthScore < notification.thresholdValue) {
      try {
        const deviceKey = await prisma.address.findUniqueOrThrow({
          where: { pubKey: notification.addressPubKey },
        });
        // construct JSON Payload
        // send payload to notification serviceeee
      } catch (err) {
        console.log(err);
      }
    }
  });
};

const getHealthScoreByAddress = async (address: string): Promise<number> => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://mainnet.infura.io/v3/a1b56be8bd4d4b6fa5a343abffe797ab" // mainnet
  );
  const eulerLens = new ethers.Contract(
    "0xc2d41d42939109CDCfa26C6965269D9C0220b38E", // Euler simple lens mainnet
    eulerLensContract.abi,
    provider
  );
  const { healthScore }: { healthScore: BigNumber } =
    await eulerLens.getAccountStatus(address);
  return parseInt(ethers.utils.formatEther(healthScore));
};
