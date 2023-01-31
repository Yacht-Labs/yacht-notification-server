import express from "express";
import db from "../../../../../prisma/db";
import logger from "../../../../utils/Logging/logger";
const router = express.Router();

router.post("/", async (req, res) => {
  const { accountId, thresholdValue, deviceId, subAccountId } = req.body;
  try {
    const healthNotification = await db.eulerHealthNotification.create({
      data: {
        account: {
          connect: {
            id: accountId,
          },
        },
        deviceId,
        thresholdValue,
        subAccountId,
      },
    });
    return res.json(healthNotification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    return res.sendStatus(500);
  }
});

router.get("/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  try {
    const healthNotifications = await db.eulerHealthNotification.findMany({
      where: {
        deviceId,
        isActive: true,
      },
    });
    return res.json(healthNotifications);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    return res.sendStatus(500);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { thresholdValue } = req.body;
  try {
    const healthNotification = await db.eulerHealthNotification.update({
      where: {
        id,
      },
      data: {
        thresholdValue,
        seen: false,
      },
    });
    return res.json(healthNotification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    return res.sendStatus(500);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const healthNotification = await db.eulerHealthNotification.update({
      where: { id },
      data: { isActive: false },
    });
    return res.json(healthNotification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    return res.sendStatus(500);
  }
});

export default router;
