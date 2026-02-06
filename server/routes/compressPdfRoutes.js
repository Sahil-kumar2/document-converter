import express from 'express';
<<<<<<< HEAD
import { pdfFileFields } from '../middleware/upload.js';
=======
import { uploadSinglePdf, normalizePdfFile } from '../middleware/multerconfig.js';
>>>>>>> origin/pdffeatures
import * as compressPdfController from '../controllers/compressPdfController.js';

const router = express.Router();

<<<<<<< HEAD
// Normalize so controller gets req.file
const normalizePdfFile = (req, res, next) => {
  if (req.files) {
    req.file = req.files['pdfFile']?.[0] ?? req.files['pdfFile ']?.[0];
  }
  next();
};

router.post(
  '/compress',
  pdfFileFields,
  normalizePdfFile,
  compressPdfController.compressPdf
);
=======
// POST /api/pdf/compress — compressionLevel: "low" | "medium" | "high"
router.post('/compress', uploadSinglePdf, normalizePdfFile, compressPdfController.compressPdf);
>>>>>>> origin/pdffeatures

export default router;

