import express from "express";
import { uploadSingleConvertFile, validateFileSizeByExtension } from "../middleware/multerconfig.js";
import { convertFile } from "../controllers/convertController.js";

const router = express.Router();

router.post(
  "/",
  (req, res, next) => {
    console.log(" /api/convert route hit");
    next();
  },
  uploadSingleConvertFile,
  validateFileSizeByExtension,
  convertFile
);

export default router;