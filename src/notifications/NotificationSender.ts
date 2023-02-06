import { NotificationType } from "../types";

export abstract class NotificationSender {
  abstract sendNotification(
    message: string,
    deviceId: string,
    notificationId: string,
    notificationType: NotificationType
  ): Promise<boolean>;
}
