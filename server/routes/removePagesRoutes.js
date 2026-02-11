import express from 'express';
import { uploadSinglePdf, normalizePdfFile, validateTotalUploadSize } from '../middleware/multerconfig.js';
import * as removePagesController from '../controllers/removePagesController.js';

const router = express.Router();

// POST /api/pdf/remove-pages — pageRanges: "1,3,5-7"
router.post(
	'/remove-pages',
	uploadSinglePdf,
	validateTotalUploadSize(),
	normalizePdfFile,
	removePagesController.removePages
);

export default router;
