import express from "express";
import { uploadAndLock } from "../controllers/lockDocumentController.js";
import upload from "../utils/fileUtils.js";
const router = express.Router();

router.post("/lockDocument",upload.single("file"), uploadAndLock );

export default router;


