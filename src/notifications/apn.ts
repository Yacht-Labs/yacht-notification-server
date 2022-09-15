import {
  getApnAuthKey,
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
      production: isProduction(),
    });
  }
  async sendNotification(message: string, deviceId: string) {
    const note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.alert = message;
    note.topic = "com.YachtLabs.Yacht";
    try {
      const res = await this.provider.send(note, deviceId);
    } catch (err) {
      logger.error(err);
    }
  }
}
