import db from "../../../prisma/db";
import {
  generateNotification,
  sendNotification,
} from "../../notifications/apn";
import logger from "../../utils/logger";

export const sendIRNotification = async () => {
  try {
    const notifications = await db.eulerIRNotification.findMany({
      where: { isActive: true, deviceId: { not: "NOTIFICATIONS_DISABLED" } },
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
