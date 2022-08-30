import db from "../../prisma/db";
import { generateNotification, sendNotification } from "../notifications/apn";
import { getHealthScoreByAddress } from "../server/routes/Euler";
import logger from "../utils/logger";

export const sendIRNotification = async () => {
  try {
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
            try {
              await sendNotification(note, notification.deviceId);
              await db.eulerIRNotification.update({
                where: { id: notification.id },
                data: {
                  borrowAPY,
                },
              });
            } catch (err) {
              logger.error(`Error sending EulerIR notification: ${err}`);
            }
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
        logger.error(err);
      }
    });
  } catch (err) {
    logger.error(err);
  }
};

export const sendHealthNotifications = async () => {
  try {
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
          console.log(`Error sending Euler health notification: ${err}`);
        }
      }
      if (
        notification.seen &&
        healthScore >= notification.thresholdValue * 1.1
      ) {
        await db.eulerHealthNotification.update({
          where: { id: notification.id },
          data: { seen: false },
        });
      }
    });
  } catch (err) {
    logger.error(err);
  }
};
