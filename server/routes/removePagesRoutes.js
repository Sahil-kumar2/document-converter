import express from 'express';
import { uploadSingleFile, normalizePdfFile } from '../middleware/multerconfig.js';
import * as removePagesController from '../controllers/removePagesController.js';

const router = express.Router();

// POST /api/pdf/remove-pages — pageRanges: "1,3,5-7"
router.post('/remove-pages', uploadSingleFile, removePagesController.removePages);

export default router;
