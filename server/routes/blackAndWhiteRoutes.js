import express from "express";
import upload from "../utils/fileUtils.js";
import { blackWhiteController } from "../controllers/blackAndWhiteController.js";

const router = express.Router();

router.post(
  "/black-white",
  upload.single("image"),
  blackWhiteController
);

export default router;
