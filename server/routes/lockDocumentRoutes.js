import express from "express";
import { uploadAndLock } from "../controllers/lockDocumentController.js";
import { uploadSingleFile } from "../middleware/multerconfig.js";
const router = express.Router();

router.post("/lockDocument", uploadSingleFile, uploadAndLock );

export default router;


