import { updateEulApys } from "./../jobs/eulerTokens/eulerAPYScript";
import express from "express";
import eulerRoutes from "./routes/euler/";
import accountRoutes from "./routes/account";
import notificationRoutes from "./routes/notifications/";
import { runJobs } from "../jobs";
const app = express();
const port = 3000;

app.use(express.json());
app.use("/euler", eulerRoutes);
app.use("/accounts", accountRoutes);
app.use("/notifications", notificationRoutes);
app.use("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  await runJobs();
});
