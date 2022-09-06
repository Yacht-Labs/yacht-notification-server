import { DatabaseError } from "./../types/errors";
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
      let notificationText: string = "";
      if (notification.borrowAPY) {
        if (notification.borrowLowerThreshold) {
          const lowerBound =
            notification.borrowAPY * (1 - notification.borrowLowerThreshold);
          if (borrowAPY < lowerBound) {
            notificationText = `The Euler borrowAPY on ${eulerToken.token.symbol} is now ${borrowAPY}!`;
          }
        }
        if (notification.borrowUpperThreshold) {
          const upperBound =
            notification.borrowAPY * (1 + notification.borrowUpperThreshold);
          if (borrowAPY > upperBound) {
            notificationText = `The Euler borrowAPY on ${eulerToken.token.symbol} is now ${borrowAPY}!`;
          }
        }
      }
      if (notification.supplyAPY) {
        if (notification.supplyLowerThreshold) {
          const lowerBound =
            notification.supplyAPY * (1 - notification.supplyLowerThreshold);
          if (supplyAPY < lowerBound) {
            notificationText = `The Euler supplyAPY on ${eulerToken.token.symbol} is now ${supplyAPY}!`;
          }
        }
        if (notification.supplyUpperThreshold) {
          const upperBound =
            notification.supplyAPY * (1 + notification.supplyUpperThreshold);
          if (supplyAPY > upperBound) {
            notificationText = `The Euler supplyAPY on ${eulerToken.token.symbol} is now ${supplyAPY}!`;
          }
        }
      }
      if (notificationText) {
        try {
          await sendNotification(
            generateNotification(notificationText),
            notification.deviceId
          );
          await db.eulerIRNotification.update({
            where: { id: notification.id },
            data: {
              borrowAPY,
              supplyAPY,
            },
          });
        } catch (err) {
          logger.error(`Error sending EulerIR notification: ${err}`);
        }
      }
    });
  } catch (databaseError) {
    logger.error(databaseError);
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
