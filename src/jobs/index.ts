import { SquidService } from "./../services/SquidService";
import cron from "node-cron";
import { sendHealthNotifications } from "./notifications/euler/sendHealthNotifications";
import { sendIRNotifications } from "./notifications/euler/sendIRNotifications";
import { updateTokenList } from "./updateTokens";
import { updateEulerTokens } from "./eulerTokens/updateEulerTokens";
import { updateEulApys } from "./eulerTokens/eulerAPYScript";
import { isTest } from "../utils";
import { TokenService } from "../services/TokenService";

export const runJobs = async () => {
  if (!isTest()) {
    await SquidService.updateTokenList();
    // await TokenService.updateTokenList();
    cron.schedule("* * * * *", async () => {
      // await updateEulerTokens();
      // await updateEulApys();
      // await sendHealthNotifications();
      // await sendIRNotifications();
    });
  }
};
