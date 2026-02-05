import express from 'express';
import { pdfFilesFields } from '../middleware/upload.js';
import * as mergePdfController from '../controllers/mergePdfController.js';

const router = express.Router();

router.post('/merge', pdfFilesFields, mergePdfController.mergePdfs);

export default router;

