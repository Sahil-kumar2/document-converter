import express from "express";
import { imageGenerateController } from "../controllers/aiImageGenerationController.js";

const router = express.Router();

router.post(
  "/generate-image",
  imageGenerateController
);

export default router;
