import cron from "node-cron";
import { updateAPYs } from "./updateTokens";

export const runJobs = () => {
  updateAPYs();
  cron.schedule("* * * * *", () => {
    updateAPYs();
  });
};
