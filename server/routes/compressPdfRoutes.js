import express from 'express';
import { pdfFileFields } from '../middleware/upload.js';
import * as compressPdfController from '../controllers/compressPdfController.js';

const router = express.Router();

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

export default router;

