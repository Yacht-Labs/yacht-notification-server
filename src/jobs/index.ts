import cron from "node-cron";
import { sendHealthNotifications } from "./notifications/euler/sendHealthNotifications";
import { sendIRNotifications } from "./notifications/euler/sendIRNotifications";
import { updateTokenList } from "./updateTokens";
import { updateEulerTokens } from "./eulerTokens/updateEulerTokens";
import { updateEulApys } from "./eulerTokens/eulerAPYScript";

export const runJobs = () => {
  cron.schedule("* * * * *", async () => {
    await updateTokenList();
    await updateEulerTokens();
    await updateEulApys();
  });
  cron.schedule("*/10 * * * * *", async () => {
    await sendHealthNotifications();
    await sendIRNotifications();
  });
};
