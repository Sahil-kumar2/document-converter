import express from "express";
import multer from "multer";
import { convertImagesToPDF } from "../controllers/createPDFFromImagesController.js";

const router = express.Router();

// Memory storage (NO uploads folder)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG and PNG allowed"), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

router.post("/jpg", upload.array("images", 20), convertImagesToPDF);
router.post("/png", upload.array("images", 20), convertImagesToPDF);

export default router;
