import {
  getApnAuthKey,
  getApnBundleName,
  getApnKeyId,
  getApnTeamId,
  isProduction,
} from "./../utils/environment";
import apn from "apn";
import logger from "../utils/logger";

export class NotificationService {
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
  async sendNotification(message: string, deviceId: string): Promise<boolean> {
    console.log("Sending notification");
    const note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.alert = message;
    note.topic = getApnBundleName();
    try {
      const res = await this.provider.send(note, deviceId);
      return res.sent[0] ? true : false;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }
}
