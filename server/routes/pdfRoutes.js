import express from 'express';
import {
	uploadPdfWithWatermark,
	normalizePdfFile,
	validateFileSizesByField,
	validateTotalUploadSize,
	MAX_PDF_SIZE,
	MAX_IMAGE_SIZE,
} from '../middleware/multerconfig.js';
import * as splitPdfController from '../controllers/splitPdfController.js';
import * as cropPdfController from '../controllers/cropPdfController.js';
import * as extractPdfController from '../controllers/extractPdfController.js';
import * as rotatePdfController from '../controllers/rotatePdfController.js';
import * as watermarkPdfController from '../controllers/watermarkPdfController.js';
import * as redactPdfController from '../controllers/redactPdfController.js';
import * as pdfaPdfController from '../controllers/pdfaPdfController.js';

const router = express.Router();

const watermarkSizeLimits = {
	pdfFile: MAX_PDF_SIZE,
	"pdfFile ": MAX_PDF_SIZE,
	watermarkImage: MAX_IMAGE_SIZE,
	"watermarkImage ": MAX_IMAGE_SIZE,
};

// POST /api/pdf/split — splitType: "each" | "range", pageRanges optional for range
router.post(
	'/split',
	uploadPdfWithWatermark,
	validateFileSizesByField(watermarkSizeLimits),
	validateTotalUploadSize(),
	normalizePdfFile,
	splitPdfController.splitPdf
);

// POST /api/pdf/crop — cropBox: x, y, width, height; pageNumbers optional
router.post(
	'/crop',
	uploadPdfWithWatermark,
	validateFileSizesByField(watermarkSizeLimits),
	validateTotalUploadSize(),
	normalizePdfFile,
	cropPdfController.cropPdf
);

// POST /api/pdf/extract — pageNumbers: "2,4,6-8"
router.post(
	'/extract',
	uploadPdfWithWatermark,
	validateFileSizesByField(watermarkSizeLimits),
	validateTotalUploadSize(),
	normalizePdfFile,
	extractPdfController.extractPdf
);

// POST /api/pdf/rotate — rotationAngle: 90|180|270, pageNumbers optional
router.post(
	'/rotate',
	uploadPdfWithWatermark,
	validateFileSizesByField(watermarkSizeLimits),
	validateTotalUploadSize(),
	normalizePdfFile,
	rotatePdfController.rotatePdf
);

// POST /api/pdf/watermark — watermarkText, position, opacity, fontSize, pageNumbers
router.post(
	'/watermark',
	uploadPdfWithWatermark,
	validateFileSizesByField(watermarkSizeLimits),
	validateTotalUploadSize(),
	normalizePdfFile,
	watermarkPdfController.watermarkPdf
);

// POST /api/pdf/redact — redactText and/or redactAreas, pageNumbers optional
router.post(
	'/redact',
	uploadPdfWithWatermark,
	validateFileSizesByField(watermarkSizeLimits),
	validateTotalUploadSize(),
	normalizePdfFile,
	redactPdfController.redactPdf
);

// POST /api/pdf/pdfa — pdfaLevel (PDF/A-1b, PDF/A-2b, PDF/A-3b)
router.post(
	'/pdfa',
	uploadPdfWithWatermark,
	validateFileSizesByField(watermarkSizeLimits),
	validateTotalUploadSize(),
	normalizePdfFile,
	pdfaPdfController.convertToPdfa
);

export default router;
