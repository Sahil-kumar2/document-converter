import express from "express";
import { uploadSinglePdf, normalizePdfFile } from "../middleware/multerconfig.js";
import { organizePdfController } from "../controllers/organizePdfController.js";

const router = express.Router();

router.post("/organize", uploadSinglePdf, normalizePdfFile, organizePdfController);

export default router;
