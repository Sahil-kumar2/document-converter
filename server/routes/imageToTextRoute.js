import express from "express";
import { uploadSingleImage } from "../middleware/multerconfig.js";
import { imageToText } from "../controllers/imageToTextController.js";

const router = express.Router();

router.post(
  "/getText",
  uploadSingleImage,
  imageToText
);

export default router;