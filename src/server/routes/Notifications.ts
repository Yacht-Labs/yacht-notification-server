import { prisma } from "@prisma/client";
import express from "express";
import db from "../../../prisma/db";
const router = express.Router();

router.post("euler/ir", async (req, res) => {
  const {
    accountId,
    deviceId,
    tokenAddress,
    borrowAPY,
    supplyAPY,
    supplyThreshold,
    borrowThreshold,
  } = req.body;
  const irNotification = await db.eulerIRNotification.create({
    data: {
      accountId,
      deviceId,
      tokenAddress,
      borrowAPY,
      supplyAPY,
      supplyThreshold,
      borrowThreshold,
    },
  });
  res.json(irNotification);
});

router.get("euler/ir/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const irNotifications = await db.eulerIRNotification.findMany({
    where: {
      deviceId,
      isActive: true,
    },
  });
  res.json(irNotifications);
});

router.put("/euler/ir/:id", async (req, res) => {
  const { id } = req.params;
  const { borrowThreshold, supplyThreshold } = req.body;
  const notification = await db.eulerIRNotification.findUnique({
    where: { id },
  });
  const updatedNotification = await db.eulerIRNotification.update({
    where: { id },
    data: {
      borrowThreshold: borrowThreshold
        ? borrowThreshold
        : notification?.borrowThreshold,
      supplyThreshold: supplyThreshold
        ? supplyThreshold
        : notification?.supplyThreshold,
    },
  });
  res.json(updatedNotification);
});

router.delete("/euler/ir/:id", async (req, res) => {
  const { id } = req.params;
  const notification = await db.eulerIRNotification.update({
    where: { id },
    data: { isActive: false },
  });
  res.json(notification);
});

router.post("/euler/health", async (req, res) => {
  const { accountId, thresholdValue, deviceId } = req.body;
  const healthNotification = await db.eulerHealthNotification.create({
    data: {
      accountId,
      deviceId,
      thresholdValue,
    },
  });
  res.json(healthNotification);
});

router.get("/euler/health/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const healthNotifications = await db.eulerHealthNotification.findMany({
    where: {
      deviceId,
      isActive: true,
    },
  });
  res.json(healthNotifications);
});

router.put("/euler/health/:id", async (req, res) => {
  const { id } = req.params;
  const { thresholdValue } = req.body;
  const healthNotification = await db.eulerHealthNotification.update({
    where: {
      id,
    },
    data: {
      thresholdValue,
    },
  });
  res.json(healthNotification);
});

router.delete("/euler/health/:id", async (req, res) => {
  const { id } = req.params;
  const healthNotification = await db.eulerHealthNotification.update({
    where: { id },
    data: { isActive: false },
  });
  res.json(healthNotification);
});

export default router;
