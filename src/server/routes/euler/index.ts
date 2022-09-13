import express from "express";
import accountRoutes from "./account";
import tokenRoutes from "./tokens";

const router = express.Router();

router.use("/account", accountRoutes);
router.use("/tokens", tokenRoutes);

export default router;
