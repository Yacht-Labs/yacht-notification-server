import { ProviderError } from "./../types/errors";
import express from "express";
import eulerRoutes from "./routes/euler/";
import accountRoutes from "./routes/account";
import notificationRoutes from "./routes/notifications/";
import litRoutes from "./routes/lit/routes";
import ErrorHandler from "../utils/errors";
import { runJobs } from "../jobs";
import httpLogger from "../utils/Logging/morgan";
import { BusinessLogicError } from "../types/errors";
import { Console } from "winston/lib/winston/transports";
export const app = express();
const port = 3000;

app.use(httpLogger);
app.use(express.json());
app.use("/euler", eulerRoutes);
app.use("/accounts", accountRoutes);
app.use("/notifications", notificationRoutes);
app.use("/lit", litRoutes);
app.get("/errorHandler", (req, res, next) => {
  try {
    throw new ProviderError("THIS IS MY ERROR MESSAGE");
  } catch (e) {
    next(e);
  }
});
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use(ErrorHandler.logError);
app.use(ErrorHandler.handleError);

export const server = app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
  await runJobs();
});
