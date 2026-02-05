import express from "express";
import { uploadMultiplePdfs } from "../middleware/multerconfig.js";
import { organizePdfController } from "../controllers/organizePdfController.js";

const router = express.Router();

router.post("/organize", uploadMultiplePdfs, organizePdfController);

export default router;
