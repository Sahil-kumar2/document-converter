import express from "express";
import signPdfRoutes from "./signPdfRoutes.js";
import organizePdfRoutes from "./organizePdfRoutes.js";

const router = express.Router();

router.use("/pdf", signPdfRoutes);
router.use("/pdf", organizePdfRoutes);

export default router;
