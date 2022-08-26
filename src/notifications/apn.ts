import {
  getApnAuthKey,
  getApnKeyId,
  getApnTeamId,
} from "./../utils/environment";
import * as dotenv from "dotenv";
dotenv.config();
import apn from "apn";

var options = {
  token: {
    key: getApnAuthKey(),
    keyId: getApnKeyId(),
    teamId: getApnTeamId(),
  },
  production: false,
};

const deviceId =
  "239aea977817554cb944568d1ee7a9dcdb08bd86041574346f0d0943b23035db"; // straus
// "ad3b33e47917d1e1dc388c53849922bb23a79ad93ef7c3ec4d8e7682604c73fe"; // henry
var note = new apn.Notification();
note.expiry = Math.floor(Date.now() / 1000) + 3600;
note.alert = "WAGMI";
note.topic = "com.YachtLabs.Yacht";

var apnProvider = new apn.Provider(options);

apnProvider.send(note, deviceId).then((data) => process.exit());
