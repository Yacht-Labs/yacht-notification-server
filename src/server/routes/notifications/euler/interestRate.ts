import express from "express";
import db from "../../../../../prisma/db";
import logger from "../../../../utils/logger";
const router = express.Router();

router.post("/ir", async (req, res) => {
  const {
    deviceId,
    tokenAddress,
    borrowAPY,
    supplyAPY,
    supplyLowerThreshold,
    supplyUpperThreshold,
    borrowUpperThreshold,
    borrowLowerThreshold,
  } = req.body;
  try {
    const irNotification = await db.eulerIRNotification.create({
      data: {
        deviceId,
        token: {
          connect: { address: tokenAddress },
        },
        borrowAPY,
        supplyAPY,
        supplyLowerThreshold,
        supplyUpperThreshold,
        borrowUpperThreshold,
        borrowLowerThreshold,
      },
    });
    console.log({ irNotification });
    return res.json(irNotification);
  } catch (err) {
    logger.error(`Database error: ${err}`);
    res.sendStatus(500);
  }
});

router.get("/ir/:deviceId", async (req, res) => {
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

router.put("/ir/:id", async (req, res) => {
  const { id } = req.params;
  const {
    borrowUpperThreshold,
    borrowLowerThreshold,
    supplyUpperThreshold,
    supplyLowerThreshold,
  } = req.body;
  try {
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

router.delete("/ir/:id", async (req, res) => {
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

export default router;
