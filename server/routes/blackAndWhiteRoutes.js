import express from "express";
import { uploadSingleImage } from "../middleware/multerconfig.js";
import { blackWhiteController } from "../controllers/blackAndWhiteController.js";

const router = express.Router();

router.post(
  "/black-white",
  uploadSingleImage,
  blackWhiteController
);

export default router;
