import db from "../../../prisma/db";
import {
  generateNotification,
  sendNotification,
} from "../../notifications/apn";
import { EulerService } from "../../services/EulerService";
import logger from "../../utils/logger";

export const sendHealthNotifications = async () => {
  try {
    const healthNotifications = await db.eulerHealthNotification.findMany({
      where: { isActive: true, deviceId: { not: "NOTIFICATIONS_DISABLED" } },
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
    for (const notification of healthNotifications) {
      const healthScore = await EulerService.getHealthScoreByAddress(
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
          logger.error(`Error sending Euler health notification: ${err}`);
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
    }
  } catch (err) {
    logger.error(err);
  }
};
