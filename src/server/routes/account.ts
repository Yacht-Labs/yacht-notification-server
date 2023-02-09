import express from "express";
import db from "../../../prisma/db";
import logger from "../../utils/Logging/logger";
const router = express.Router();

router.get("/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  try {
    const account = await db.account.findMany({
      where: {
        deviceId,
      },
    });
    res.json(account);
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
});

router.post("/", async (req, res) => {
  const { address, deviceId, name } = req.body;
  if (
    typeof address !== "string" ||
    typeof deviceId !== "string" ||
    typeof name !== "string"
  ) {
    logger.error(`Type error`);
    res.sendStatus(400);
  }
  try {
    const account = await db.account.create({
      data: {
        address,
        deviceId,
        name: name ? name : address,
      },
    });
    res.json(account);
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (typeof name !== "string") {
    logger.error("Type error");
    res.sendStatus(400);
  }
  try {
    const account = await db.account.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });
    res.json(account);
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const account = await db.account.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
    const irNotifications = await db.eulerIRNotification.findMany({
      where: {
        deviceId: account.deviceId,
      },
    });
    for (const notification of irNotifications) {
      await db.eulerIRNotification.update({
        where: {
          id: notification.id,
        },
        data: {
          isActive: false,
        },
      });
    }
    const healthNotifications = await db.eulerHealthNotification.findMany({
      where: {
        accountId: account.id,
      },
    });
    for (const notification of healthNotifications) {
      await db.eulerHealthNotification.update({
        where: {
          id: notification.id,
        },
        data: {
          isActive: false,
        },
      });
    }
    res.json(account);
  } catch (err) {
    logger.error(err);
    res.sendStatus(500);
  }
});

export default router;
