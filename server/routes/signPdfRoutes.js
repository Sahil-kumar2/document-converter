import express from "express";
import {
  uploadPdf,
  normalizePdfFile,
  validateFileSizesByField,
  validateTotalUploadSize,
  MAX_PDF_SIZE,
  MAX_IMAGE_SIZE,
} from "../middleware/multerconfig.js";
import { signPdfController } from "../controllers/signPdfController.js";

const router = express.Router();

// Accept pdfFile and optional signatureImage
const signFields = uploadPdf.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 },
  { name: "signatureImage", maxCount: 1 },
]);

const signFieldLimits = {
  pdfFile: MAX_PDF_SIZE,
  "pdfFile ": MAX_PDF_SIZE,
  signatureImage: MAX_IMAGE_SIZE,
};

router.post(
  "/sign",
  signFields,
  validateFileSizesByField(signFieldLimits),
  validateTotalUploadSize(),
  normalizePdfFile,
  signPdfController
);

export default router;
