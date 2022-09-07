import express from "express";
import db from "../../../prisma/db";
import logger from "../../utils/logger";
const router = express.Router();

router.post("euler/ir", async (req, res) => {
  const {
    accountId,
    deviceId,
    tokenAddress,
    borrowAPY,
    supplyAPY,
    supplyLowerThreshold,
    supplyUpperThreshold,
    borrowUpperThreshold,
    borrowLowerThreshold,
    subAccountId,
  } = req.body;
  try {
    const irNotification = await db.eulerIRNotification.create({
      data: {
        accountId,
        deviceId,
        tokenAddress,
        borrowAPY,
        supplyAPY,
        supplyLowerThreshold,
        supplyUpperThreshold,
        borrowUpperThreshold,
        borrowLowerThreshold,
        subAccountId,
      },
    });
    return res.json(irNotification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    res.sendStatus(500);
  }
});

router.get("euler/ir/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  try {
    const irNotifications = await db.eulerIRNotification.findMany({
      where: {
        deviceId,
        isActive: true,
      },
    });
    return res.json(irNotifications);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    res.sendStatus(500);
  }
});

router.put("/euler/ir/:id", async (req, res) => {
  const { id } = req.params;
  const {
    borrowUpperThreshold,
    borrowLowerThreshold,
    supplyUpperThreshold,
    supplyLowerThreshold,
  } = req.body;
  try {
    const notification = await db.eulerIRNotification.findUnique({
      where: { id },
    });
    const updatedNotification = await db.eulerIRNotification.update({
      where: { id },
      data: {
        borrowUpperThreshold,
        borrowLowerThreshold,
        supplyUpperThreshold,
        supplyLowerThreshold,
      },
    });
    return res.json(updatedNotification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    return res.sendStatus(500);
  }
});

router.delete("/euler/ir/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await db.eulerIRNotification.update({
      where: { id },
      data: { isActive: false },
    });
    res.json(notification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    return res.sendStatus(500);
  }
});

router.post("/euler/health", async (req, res) => {
  const { accountId, thresholdValue, deviceId, subAccountId } = req.body;
  try {
    const healthNotification = await db.eulerHealthNotification.create({
      data: {
        accountId,
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

router.get("/euler/health/:deviceId", async (req, res) => {
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

router.put("/euler/health/:id", async (req, res) => {
  const { id } = req.params;
  const { thresholdValue } = req.body;
  try {
    const healthNotification = await db.eulerHealthNotification.update({
      where: {
        id,
      },
      data: {
        thresholdValue,
      },
    });
    return res.json(healthNotification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    return res.sendStatus(500);
  }
});

router.delete("/euler/health/:id", async (req, res) => {
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
