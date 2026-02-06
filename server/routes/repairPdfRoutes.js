import express from 'express';
<<<<<<< HEAD
import upload from '../middleware/upload.js'; 
=======
import { uploadSinglePdf, normalizePdfFile } from '../middleware/multerconfig.js';
>>>>>>> origin/pdffeatures
import * as repairPdfController from '../controllers/repairPdfController.js';

const router = express.Router();

// POST /api/pdf/repair
router.post('/repair', uploadSinglePdf, normalizePdfFile, repairPdfController.repairPdf);

export default router;
