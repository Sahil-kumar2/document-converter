import express from 'express';
import { upload } from '../utils/multerConfig.js';
import * as removePagesController from '../controllers/removePagesController.js';

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

// POST /api/pdf/remove-pages — pageRanges: "1,3,5-7"
router.post('/remove-pages', pdfFields, normalizePdfFile, removePagesController.removePages);

export default router;
