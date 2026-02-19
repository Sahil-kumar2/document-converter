import express from "express";
import multer from "multer";
import { imageToText } from "../controllers/imageToTextController.js";

const router = express.Router();

// ✅ Memory storage (no file saved)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// POST /api/ocr
router.post("/", upload.single("file"), imageToText);

export default router;
