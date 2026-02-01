import express from "express";
import multer from "multer";
import { mergeExcelController } from "../controllers/excelMergeController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/merge-excel",
  upload.array("files", 10),
  mergeExcelController
);

export default router;
