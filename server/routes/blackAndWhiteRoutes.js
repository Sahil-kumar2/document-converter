import express from "express";
import { uploadMultipleFiles } from "../middleware/multerconfig.js";
import { blackWhiteController } from "../controllers/blackAndWhiteController.js";

const router = express.Router();

router.post(
  "/black-white",
  uploadMultipleFiles,
  blackWhiteController
);

export default router;
