import express from 'express';
<<<<<<< HEAD
import { pdfFilesFields } from '../middleware/upload.js';
=======
import { uploadMultiplePdfs } from '../middleware/multerconfig.js';
>>>>>>> origin/pdffeatures
import * as mergePdfController from '../controllers/mergePdfController.js';

const router = express.Router();

<<<<<<< HEAD
router.post('/merge', pdfFilesFields, mergePdfController.mergePdfs);
=======
// POST /api/pdf/merge — accepts multiple PDF files
router.post('/merge', uploadMultiplePdfs, mergePdfController.mergePdfs);
>>>>>>> origin/pdffeatures

export default router;

