import { EulerNotificationService } from "./../../../notifications/euler/EulerNotificationService";
import db from "../../../../prisma/db";
import logger from "../../../utils/Logging/logger";
import { NotificationService } from "../../../notifications/apn";
import { AppleNotificationSender } from "../../../notifications/AppleNotificationSender";

export const sendIRNotifications = async () => {
  try {
    console.log("...Sending IR Notifications...");
    const notifications = await db.eulerIRNotification.findMany({
      where: { isActive: true, deviceId: { not: "NOTIFICATIONS_DISABLED" } },
    });
    const appleNotificationSender = new AppleNotificationSender();
    const notifier = new EulerNotificationService(appleNotificationSender);
    for (const notification of notifications) {
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
      notifier.processIRNotification(
        borrowAPY,
        supplyAPY,
        eulerToken.token.symbol,
        notification
      );
    }
    console.log("...Finished sending IR notifications...\n");
  } catch (databaseError) {
    logger.error(databaseError);
  }
};
