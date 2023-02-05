import { EulerNotificationService } from "../../../notifications/euler/EulerNotificationService";
import logger from "../../../utils/Logging/logger";
import { AppleNotificationSender } from "../../../notifications/AppleNotificationSender";

export const sendHealthNotifications = async () => {
  try {
    console.log("...Sending Euler health notifications...\n");
    const appleNotificationSender = new AppleNotificationSender();
    const notifier = new EulerNotificationService(appleNotificationSender);
    await notifier.sendHealthNotifications();
    console.log("...Finished sending Euler health notifications...\n");
  } catch (err) {
    logger.error(err);
  }
};
