import express from "express";
import { uploadAndLock } from "../controllers/lockDocumentController.js";
import { uploadSingleConvertFile, validateFileSizeByExtension } from "../middleware/multerconfig.js";
const router = express.Router();

router.post(
	"/lockDocument",
	uploadSingleConvertFile,
	validateFileSizeByExtension,
	uploadAndLock
);

export default router;


