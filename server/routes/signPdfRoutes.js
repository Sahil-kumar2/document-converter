import express from "express";
<<<<<<< HEAD
import upload from "../middleware/upload.js";
=======
import { upload, normalizePdfFile } from "../middleware/multerconfig.js";
>>>>>>> origin/pdffeatures
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
