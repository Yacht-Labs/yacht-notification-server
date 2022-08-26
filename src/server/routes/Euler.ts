import express from "express";
import db from "../../../prisma/db";
const router = express.Router();

router.get("/tokens", async (req, res) => {
  const tokenData = await db.token.findMany();
  const eulerTokenData = await db.eulerToken.findMany();
  const combinedTokenData = tokenData.map((token) => {
    const matchedToken = eulerTokenData.find((eulerToken) => {
      eulerToken.address === token.address;
    });
    return {
      ...token,
      ...matchedToken,
    };
  });
  res.json(combinedTokenData);
});

router.get("/tokens/:address", async (req, res) => {
  const { address } = req.params;
  const tokenData = await db.token.findUnique({
    where: { address },
  });
  const eulerTokenData = await db.eulerToken.findUnique({
    where: { address },
  });
  res.json({
    ...tokenData,
    ...eulerTokenData,
  });
});

export default router;
