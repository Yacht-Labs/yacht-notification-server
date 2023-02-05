import { NotificationSender } from "./NotificationSender";
import {
  getApnAuthKey,
  getApnBundleName,
  getApnKeyId,
  getApnTeamId,
} from "./../utils/environment";
import apn from "apn";
import logger from "../utils/Logging/logger";
import { NotificationType } from "../types";
import db from "../../prisma/db";

export class AppleNotificationSender implements NotificationSender {
  private provider: apn.Provider;
  constructor() {
    this.provider = new apn.Provider({
      token: {
        key: getApnAuthKey(),
        keyId: getApnKeyId(),
        teamId: getApnTeamId(),
      },
      production: false,
    });
  }
  async sendNotification(
    message: string,
    deviceId: string,
    notificationId: string,
    notificationType: NotificationType
  ): Promise<boolean> {
    console.log("Sending notification");
    const note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.alert = message;
    note.topic = getApnBundleName();
    try {
      const res = await this.provider.send(note, deviceId);
      try {
        await db.notificationEvent.create({
          data: {
            notificationId,
            type: notificationType,
            payload: message,
            response: res.sent.length
              ? (res.sent[0] as any)
              : (res.failed[0] as any),
          },
        });
      } catch (err) {
        logger.error("Error saving notification to DB");
      }
      return res.sent[0] ? true : false;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }
}
