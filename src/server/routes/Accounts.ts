import express from "express";
import db from "../../../prisma/db";
const router = express.Router();

interface Account {
  address: string;
  deviceId: string;
  name?: string;
}

router.get("/:deviceId", async (req, res) => {
  const { deviceId } = req.params;

  const account = await db.account.findMany({
    where: {
      deviceId,
    },
  });
  res.json(account);
});

router.post("/", async (req, res) => {
  const { address, deviceId, name } = req.body;
  const account = await db.account.create({
    data: {
      address,
      deviceId,
      name: name ? name : address,
    },
  });
  res.json(account);
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const account = await db.account.update({
    where: {
      id,
    },
    data: {
      name,
    },
  });
  res.json(account);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const account = await db.account.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });
  res.json(account);
});

export default router;
