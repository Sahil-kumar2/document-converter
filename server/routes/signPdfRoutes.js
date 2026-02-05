import express from "express";
import { upload, normalizePdfFile } from "../middleware/multerconfig.js";
import { signPdfController } from "../controllers/signPdfController.js";

const router = express.Router();

// Accept pdfFile and optional signatureImage
const signFields = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 },
  { name: "signatureImage", maxCount: 1 },
]);

router.post("/sign", signFields, normalizePdfFile, signPdfController);

export default router;
