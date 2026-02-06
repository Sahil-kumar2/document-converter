import express from 'express';
<<<<<<< HEAD
import upload from '../middleware/upload.js';
=======
import { uploadSinglePdf, normalizePdfFile } from '../middleware/multerconfig.js';
>>>>>>> origin/pdffeatures
import * as removePagesController from '../controllers/removePagesController.js';

const router = express.Router();

// POST /api/pdf/remove-pages — pageRanges: "1,3,5-7"
router.post('/remove-pages', uploadSinglePdf, normalizePdfFile, removePagesController.removePages);

export default router;
