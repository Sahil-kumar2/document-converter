import express from 'express';
import { uploadPdfWithWatermark, normalizePdfFile } from '../middleware/multerconfig.js';
import * as splitPdfController from '../controllers/splitPdfController.js';
import * as cropPdfController from '../controllers/cropPdfController.js';
import * as extractPdfController from '../controllers/extractPdfController.js';
import * as rotatePdfController from '../controllers/rotatePdfController.js';
import * as watermarkPdfController from '../controllers/watermarkPdfController.js';
import * as redactPdfController from '../controllers/redactPdfController.js';
import * as pdfaPdfController from '../controllers/pdfaPdfController.js';

const router = express.Router();

// POST /api/pdf/split — splitType: "each" | "range", pageRanges optional for range
router.post('/split', uploadPdfWithWatermark, normalizePdfFile, splitPdfController.splitPdf);

// POST /api/pdf/crop — cropBox: x, y, width, height; pageNumbers optional
router.post('/crop', uploadPdfWithWatermark, normalizePdfFile, cropPdfController.cropPdf);

// POST /api/pdf/extract — pageNumbers: "2,4,6-8"
router.post('/extract', uploadPdfWithWatermark, normalizePdfFile, extractPdfController.extractPdf);

// POST /api/pdf/rotate — rotationAngle: 90|180|270, pageNumbers optional
router.post('/rotate', uploadPdfWithWatermark, normalizePdfFile, rotatePdfController.rotatePdf);

// POST /api/pdf/watermark — watermarkText, position, opacity, fontSize, pageNumbers
router.post('/watermark', uploadPdfWithWatermark, normalizePdfFile, watermarkPdfController.watermarkPdf);

// POST /api/pdf/redact — redactText and/or redactAreas, pageNumbers optional
router.post('/redact', uploadPdfWithWatermark, normalizePdfFile, redactPdfController.redactPdf);

// POST /api/pdf/pdfa — pdfaLevel (PDF/A-1b, PDF/A-2b, PDF/A-3b)
router.post('/pdfa', uploadPdfWithWatermark, normalizePdfFile, pdfaPdfController.convertToPdfa);

export default router;
