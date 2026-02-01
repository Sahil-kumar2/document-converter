import express from "express";
import upload from "../utils/fileUtils.js";
import { imageToText } from "../controllers/imageToTextController.js";

const router = express.Router();

router.post(
  "/getText",
  upload.single("image"),
imageToText
);

export default router;