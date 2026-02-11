import express from 'express';
import { uploadSinglePdf, normalizePdfFile, validateTotalUploadSize } from '../middleware/multerconfig.js';
import * as repairPdfController from '../controllers/repairPdfController.js';

const router = express.Router();

// POST /api/pdf/repair
router.post(
	'/repair',
	uploadSinglePdf,
	validateTotalUploadSize(),
	normalizePdfFile,
	repairPdfController.repairPdf
);

export default router;
