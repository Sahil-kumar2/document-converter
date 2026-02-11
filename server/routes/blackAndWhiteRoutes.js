import express from "express";
import { uploadSingleImage, validateTotalUploadSize } from "../middleware/multerconfig.js";
import { blackWhiteController } from "../controllers/blackAndWhiteController.js";

const router = express.Router();

router.post(
  "/black-white",
  uploadSingleImage,
  validateTotalUploadSize(),
  blackWhiteController
);

export default router;
