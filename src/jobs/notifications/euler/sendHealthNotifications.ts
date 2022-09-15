import db from "../../../../prisma/db";
import { EulerService } from "../../../services/EulerService";
import { EulerNotificationService } from "../../../notifications/euler/EulerNotificationService";
import logger from "../../../utils/logger";
import { getSubAccountAddressFromAccount } from "../../../utils";

export const sendHealthNotifications = async () => {
  try {
    console.log("...Sending health notifications...");
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
    const notifier = new EulerNotificationService();
    for (const notification of healthNotifications) {
      const healthScore = await EulerService.getHealthScoreByAddress(
        getSubAccountAddressFromAccount(
          notification.account.address,
          notification.subAccountId
        )
      );
      notifier.processHealthNotification(healthScore, notification);
    }
    console.log("...Finished sending health notifications...\n");
  } catch (err) {
    logger.error(err);
  }
};
