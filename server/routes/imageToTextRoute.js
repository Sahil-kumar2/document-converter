import express from "express";
import { singleFile } from "../middleware/upload.js";
import { imageToText } from "../controllers/imageToTextController.js";

const router = express.Router();

router.post(
  "/getText",

  singleFile,
  imageToText
);

export default router;