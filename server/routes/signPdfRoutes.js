import express from "express";
import upload from "../middleware/upload.js";
import { signPdfController } from "../controllers/signPdfController.js";

const router = express.Router();

const pdfFields = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 },
]);

const normalizePdfFile = (req, res, next) => {
  if (req.files) {
    req.file = req.files["pdfFile"]?.[0] ?? req.files["pdfFile "]?.[0];
  }
  next();
};

router.post("/sign", pdfFields, normalizePdfFile, signPdfController);

export default router;
