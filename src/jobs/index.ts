import cron from "node-cron";

export const runJobs = () => {
  cron.schedule("* * * * *", () => {});
};
