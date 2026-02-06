import express from 'express';
import { uploadMultiplePdfs } from '../middleware/multerconfig.js';
import * as mergePdfController from '../controllers/mergePdfController.js';

const router = express.Router();

// POST /api/pdf/merge — accepts multiple PDF files
router.post('/merge', uploadMultiplePdfs, mergePdfController.mergePdfs);

export default router;

