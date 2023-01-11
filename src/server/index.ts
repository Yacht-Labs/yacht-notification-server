import express from "express";
import eulerRoutes from "./routes/euler/";
import accountRoutes from "./routes/account";
import notificationRoutes from "./routes/notifications/";
import litRoutes from "./routes/lit/routes";
import { runJobs } from "../jobs";
export const app = express();
const port = 3000;

app.use(express.json());
app.use("/euler", eulerRoutes);
app.use("/accounts", accountRoutes);
app.use("/notifications", notificationRoutes);
app.use("/lit", litRoutes);
app.get("/", (req, res) => {
  res.send("Hello World");
});
export const server = app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  console.log("NODE_ENV var: ", process.env.NODE_ENV);
  await runJobs();
});
