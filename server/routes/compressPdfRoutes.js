import express from 'express';
import { uploadSinglePdf, normalizePdfFile, validateTotalUploadSize } from '../middleware/multerconfig.js';
import * as compressPdfController from '../controllers/compressPdfController.js';

const router = express.Router();

// POST /api/pdf/compress — compressionLevel: "low" | "medium" | "high"
router.post(
	'/compress',
	uploadSinglePdf,
	validateTotalUploadSize(),
	normalizePdfFile,
	compressPdfController.compressPdf
);

export default router;
