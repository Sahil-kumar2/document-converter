import express from "express";
import multer from "multer";
import { mergeExcelController } from "../controllers/excelMergeController.js";
import { MAX_EXCEL_SIZE, validateTotalUploadSize } from "../middleware/multerconfig.js";

const router = express.Router();
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: MAX_EXCEL_SIZE,
  },
});

router.post(
  "/merge-excel",
  upload.array("files", 10),
  validateTotalUploadSize(),
  mergeExcelController
);

export default router;
