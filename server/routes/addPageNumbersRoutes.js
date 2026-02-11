import express from "express";
import { uploadSinglePdf, normalizePdfFile, validateTotalUploadSize } from "../middleware/multerconfig.js";
import { addPageNumbers } from "../controllers/addPageNumbersController.js";

const router = express.Router();

// Accept pdfFile
router.post(
	"/add-page-numbers",
	uploadSinglePdf,
	validateTotalUploadSize(),
	normalizePdfFile,
	addPageNumbers
);

export default router;
