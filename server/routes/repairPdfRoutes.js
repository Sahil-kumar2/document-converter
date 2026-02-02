import express from 'express';
import { upload } from '../utils/multerConfig.js';
import * as repairPdfController from '../controllers/repairPdfController.js';

const router = express.Router();

// Accept "pdfFile" or "pdfFile " (trailing space)
const pdfFields = upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'pdfFile ', maxCount: 1 },
]);

// Normalize so controller gets req.file
const normalizePdfFile = (req, res, next) => {
  if (req.files) {
    req.file = req.files['pdfFile']?.[0] ?? req.files['pdfFile ']?.[0];
  }
  next();
};

// POST /api/pdf/repair
router.post('/repair', pdfFields, normalizePdfFile, repairPdfController.repairPdf);

export default router;
