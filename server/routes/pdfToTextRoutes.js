import express from "express";
import multer from "multer";
import { convertPdfToText } from "../controllers/pdfToTextController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.post("/convert", upload.single("file"), convertPdfToText);

export default router;
