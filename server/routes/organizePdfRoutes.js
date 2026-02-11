import express from "express";
import { uploadSinglePdf, normalizePdfFile, validateTotalUploadSize } from "../middleware/multerconfig.js";
import { organizePdfController } from "../controllers/organizePdfController.js";

const router = express.Router();

router.post(
	"/organize",
	uploadSinglePdf,
	validateTotalUploadSize(),
	normalizePdfFile,
	organizePdfController
);

export default router;
