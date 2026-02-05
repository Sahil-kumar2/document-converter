import express from "express";
import { pdfFileFields } from "../middleware/upload.js";
import { organizePdfController } from "../controllers/organizePdfController.js";

const router = express.Router();

const normalizePdfFile = (req, res, next) => {
  if (req.files) {
    req.file = req.files["pdfFile"]?.[0] ?? req.files["pdfFile "]?.[0];
  }
  next();
};

router.post(
  "/organize",
  pdfFileFields,
  normalizePdfFile,
  organizePdfController
);

export default router;
