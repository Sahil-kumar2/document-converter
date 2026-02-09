import express from "express";
import signPdfRoutes from "./signPdfRoutes.js";
import organizePdfRoutes from "./organizePdfRoutes.js";
import addPageNumbersRoutes from "./addPageNumbersRoutes.js";

const router = express.Router();

router.use("/pdf", signPdfRoutes);
router.use("/pdf", organizePdfRoutes);
router.use("/pdf", addPageNumbersRoutes);

export default router;
