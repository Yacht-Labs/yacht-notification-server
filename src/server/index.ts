import express from "express";
import eulerRoutes from "./routes/Euler";
import accountRoutes from "./routes/Accounts";
import notificationRoutes from "./routes/Notifications";
import { runJobs } from "../jobs";
const app = express();
const port = 3000;

app.use(express.json());
app.use("/euler", eulerRoutes);
app.use("/accounts", accountRoutes);
app.use("/notifications", notificationRoutes);

app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  runJobs();
});
