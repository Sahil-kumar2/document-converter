import express from "express";
<<<<<<< HEAD
import { pdfFileFields } from "../middleware/upload.js";
=======
import { uploadMultiplePdfs } from "../middleware/multerconfig.js";
>>>>>>> origin/pdffeatures
import { organizePdfController } from "../controllers/organizePdfController.js";

const router = express.Router();

<<<<<<< HEAD
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
=======
router.post("/organize", uploadMultiplePdfs, organizePdfController);
>>>>>>> origin/pdffeatures

export default router;
