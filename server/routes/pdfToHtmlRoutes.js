import express from "express";
import multer from "multer";
import { convertPdfToHtml } from "../controllers/pdfToHtmlController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/convert", upload.single("file"), convertPdfToHtml);

export default router;
