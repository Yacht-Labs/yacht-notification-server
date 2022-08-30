import cron from "node-cron";
import { updateAPYs } from "./updateTokens";

export const runJobs = () => {
  cron.schedule("* * * * *", () => {
    updateAPYs();
  });
};
