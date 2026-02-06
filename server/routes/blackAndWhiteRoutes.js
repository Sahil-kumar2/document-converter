import express from "express";
<<<<<<< HEAD
import { singleFile } from "../middleware/upload.js";
=======
import { uploadSingleImage } from "../middleware/multerconfig.js";
>>>>>>> origin/pdffeatures
import { blackWhiteController } from "../controllers/blackAndWhiteController.js";

const router = express.Router();

router.post(
  "/black-white",
<<<<<<< HEAD
  singleFile,   // handles the uploaded image
=======
  uploadSingleImage,
>>>>>>> origin/pdffeatures
  blackWhiteController
);

export default router;
