import express from "express";
import upload from "../utils/fileUtils.js";
import { blackWhiteController } from "../controllers/black_and_white_controller.js";

const router = express.Router();

router.post(
  "/black-white",
  upload.single("image"),
  blackWhiteController
);

export default router;
