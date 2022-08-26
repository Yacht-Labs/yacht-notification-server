import apn from "apn";
import path from "path";

var options = {
  token: {
    key: path.join(__dirname, "/AuthKey_3XHNL55C6G.p8"), // "path/to/APNsAuthKey_XXXXXXXXXX.p8",
    keyId: "3XHNL55C6G",
    teamId: "5L887TA4YC",
  },
  production: false,
};

const deviceId =
  // "239aea977817554cb944568d1ee7a9dcdb08bd86041574346f0d0943b23035db"; // straus
  "ad3b33e47917d1e1dc388c53849922bb23a79ad93ef7c3ec4d8e7682604c73fe"; // henry
var note = new apn.Notification();
note.expiry = Math.floor(Date.now() / 1000) + 3600;
note.alert = "URA";
note.topic = "com.YachtLabs.Yacht";

var apnProvider = new apn.Provider(options);

apnProvider.send(note, deviceId).then((data) => console.log(data));
