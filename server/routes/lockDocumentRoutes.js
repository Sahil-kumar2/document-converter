import express from "express";
import { uploadAndLock } from "../controllers/lockDocumentController.js";
//import upload from "../utils/fileUtils.js";
import { singleFile } from "../middleware/upload.js";
const router = express.Router();

//router.post("/lockDocument",upload.single("file"), uploadAndLock );
router.post("/lockDocument", singleFile, uploadAndLock);

export default router;


