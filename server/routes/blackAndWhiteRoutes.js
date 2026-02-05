import express from "express";
import { singleFile } from "../middleware/upload.js";
import { blackWhiteController } from "../controllers/blackAndWhiteController.js";

const router = express.Router();

router.post(
  "/black-white",
  singleFile,   // handles the uploaded image
  blackWhiteController
);

export default router;
