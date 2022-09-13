import express from "express";
import eulerRoutes from "./euler";

const router = express.Router();

router.use("/euler", eulerRoutes);

export default router;
