import express from "express";
import healthScoreRoutes from "./healthScore";
import irRoutes from "./interestRate";
const router = express.Router();

router.use("/health", healthScoreRoutes);
router.use("/ir", irRoutes);

export default router;
