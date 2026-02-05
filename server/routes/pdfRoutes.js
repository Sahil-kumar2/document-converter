import express from 'express';
import { upload, pdfFilesFields, pdfFileFields } from '../utils/multerConfig.js';
import * as splitPdfController from '../controllers/splitPdfController.js';
import * as cropPdfController from '../controllers/cropPdfController.js';
import * as extractPdfController from '../controllers/extractPdfController.js';
import * as rotatePdfController from '../controllers/rotatePdfController.js';
import * as watermarkPdfController from '../controllers/watermarkPdfController.js';
import * as redactPdfController from '../controllers/redactPdfController.js';
import * as pdfaPdfController from '../controllers/pdfaPdfController.js';

const router = express.Router();

// Accept "pdfFile" or "pdfFile " (trailing space from some clients e.g. Postman)
const pdfFields = upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'pdfFile ', maxCount: 1 },
  { name: 'watermarkImage', maxCount: 1 },
  { name: 'watermarkImage ', maxCount: 1 },
]);

// Normalize so controllers still get req.file
const normalizePdfFile = (req, res, next) => {
  if (req.files) {
    req.file = req.files['pdfFile']?.[0] ?? req.files['pdfFile ']?.[0];
  }
  next();
};

// POST /api/pdf/split — splitType: "each" | "range", pageRanges optional for range
router.post('/split', pdfFields, normalizePdfFile, splitPdfController.splitPdf);

// POST /api/pdf/crop — cropBox: x, y, width, height; pageNumbers optional
router.post('/crop', pdfFields, normalizePdfFile, cropPdfController.cropPdf);

// POST /api/pdf/extract — pageNumbers: "2,4,6-8"
router.post('/extract', pdfFields, normalizePdfFile, extractPdfController.extractPdf);

// POST /api/pdf/rotate — rotationAngle: 90|180|270, pageNumbers optional
router.post('/rotate', pdfFields, normalizePdfFile, rotatePdfController.rotatePdf);

// POST /api/pdf/watermark — watermarkText, position, opacity, fontSize, pageNumbers
router.post('/watermark', pdfFields, normalizePdfFile, watermarkPdfController.watermarkPdf);

// POST /api/pdf/redact — redactText and/or redactAreas, pageNumbers optional
router.post('/redact', pdfFields, normalizePdfFile, redactPdfController.redactPdf);

// POST /api/pdf/pdfa — pdfaLevel (PDF/A-1b, PDF/A-2b, PDF/A-3b)
router.post('/pdfa', pdfFields, normalizePdfFile, pdfaPdfController.convertToPdfa);

export default router;
