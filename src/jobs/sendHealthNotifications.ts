import { BigNumber, ethers } from "ethers";
import db from "../../prisma/db";
import * as eulerLensContract from "../constants/abis/eulerLens.json";
import { generateNotification, sendNotification } from "../notifications/apn";

const sendIRNotification = async () => {
  const notifications = await db.eulerIRNotification.findMany({
    where: { isActive: true },
  });
  notifications.forEach(async (notification) => {
    try {
      const eulerToken = await db.eulerToken.findFirstOrThrow({
        where: { address: notification.tokenAddress },
        include: {
          token: {
            select: {
              symbol: true,
            },
          },
        },
      });
      const { borrowAPY, supplyAPY } = eulerToken;
      if (notification.borrowAPY && notification.borrowThreshold) {
        const lowerBound =
          notification.borrowAPY * (1 - notification.borrowThreshold);
        const upperBound =
          notification.borrowAPY * (1 + notification.borrowThreshold);
        if (borrowAPY > upperBound || borrowAPY < lowerBound) {
          const note = generateNotification(
            `The Euler borrowAPY on ${eulerToken.token.symbol} is now ${borrowAPY}!`
          );
          await sendNotification(note, notification.deviceId);
          await db.eulerIRNotification.update({
            where: { id: notification.id },
            data: {
              borrowAPY,
            },
          });
        }
      }
      if (notification.supplyAPY && notification.supplyThreshold) {
        const lowerBound =
          notification.supplyAPY * notification.supplyThreshold;
        const upperBound =
          notification.supplyAPY * (1 + notification.supplyThreshold);
        if (supplyAPY > upperBound || supplyAPY < lowerBound) {
          const note = generateNotification(
            `The Euler supplyAPY on ${eulerToken.token.symbol} is now ${borrowAPY}`
          );
          await sendNotification(note, notification.deviceId);
          await db.eulerIRNotification.update({
            where: { id: notification.id },
            data: {
              supplyAPY,
            },
          });
        }
      }
    } catch (err) {
      console.log(err);
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

const sendHealthNotifications = async () => {
  const healthNotifications = await db.eulerHealthNotification.findMany({
    where: { isActive: true },
    include: {
      account: {
        select: {
          address: true,
          deviceId: true,
          name: true,
        },
      },
    },
  });
  healthNotifications.forEach(async (notification) => {
    const healthScore = await getHealthScoreByAddress(
      notification.account.address
    );
    if (healthScore < notification.thresholdValue && !notification.seen) {
      try {
        const note = generateNotification(
          `Euler healthscore for account ${notification.account.name} has dropped below ${notification.thresholdValue}!`
        );
        await sendNotification(note, notification.deviceId);
        await db.eulerHealthNotification.update({
          where: { id: notification.id },
          data: { seen: true },
        });
      } catch (err) {
        console.log(err);
      }
    }
    if (notification.seen && healthScore >= notification.thresholdValue * 1.1) {
      await db.eulerHealthNotification.update({
        where: { id: notification.id },
        data: { seen: false },
      });
    }
  });
};
