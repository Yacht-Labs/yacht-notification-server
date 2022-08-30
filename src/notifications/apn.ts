import {
  getApnAuthKey,
  getApnKeyId,
  getApnTeamId,
  isProduction,
} from "./../utils/environment";
import apn from "apn";
import logger from "../utils/logger";

var options = {
  token: {
    key: getApnAuthKey(),
    keyId: getApnKeyId(),
    teamId: getApnTeamId(),
  },
  production: isProduction(),
};

const deviceId =
  "239aea977817554cb944568d1ee7a9dcdb08bd86041574346f0d0943b23035db"; // straus
// "ad3b33e47917d1e1dc388c53849922bb23a79ad93ef7c3ec4d8e7682604c73fe"; // henry

const apnProvider = new apn.Provider(options);

export const generateNotification = (message: string): apn.Notification => {
  const note = new apn.Notification();
  note.expiry = Math.floor(Date.now() / 1000) + 3600;
  note.alert = message;
  note.topic = "com.YachtLabs.Yacht";
  return note;
};

export const sendNotification = async (
  note: apn.Notification,
  deviceId: string
) => {
  try {
    await apnProvider.send(note, deviceId);
  } catch (err) {
    logger.error(err);
  }
};
