import express from 'express';
import { upload } from '../utils/multerConfig.js';
import * as mergePdfController from '../controllers/mergePdfController.js';

const router = express.Router();

// Accept multiple PDF files (up to 10)
const pdfFilesUpload = upload.array('pdfFiles', 10);

// POST /api/pdf/merge — accepts multiple PDF files
router.post('/merge', pdfFilesUpload, mergePdfController.mergePdfs);

export default router;
