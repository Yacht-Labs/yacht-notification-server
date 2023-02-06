import { EulerNotificationService } from "./../../../notifications/euler/EulerNotificationService";
import db from "../../../../prisma/db";
import logger from "../../../utils/Logging/logger";
import { NotificationService } from "../../../notifications/apn";
import { AppleNotificationSender } from "../../../notifications/AppleNotificationSender";

export const sendIRNotifications = async () => {
  try {
    console.info("...Sending IR Notifications...");
    const appleNotificationSender = new AppleNotificationSender();
    const notifier = new EulerNotificationService(appleNotificationSender);
    await notifier.sendIRNotifications();
    console.info("...Finished sending IR notifications...\n");
  } catch (databaseError) {
    logger.error(databaseError);
  }
};
