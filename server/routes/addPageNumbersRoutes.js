import express from "express";
import { upload, normalizePdfFile } from "../middleware/multerconfig.js";
import { addPageNumbers } from "../controllers/addPageNumbersController.js";

const router = express.Router();

// Accept pdfFile
const fields = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 },
]);

router.post("/add-page-numbers", fields, normalizePdfFile, addPageNumbers);

export default router;
