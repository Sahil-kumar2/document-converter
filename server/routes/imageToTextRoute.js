import express from "express";
<<<<<<< HEAD
import { singleFile } from "../middleware/upload.js";
=======
import { uploadSingleImage } from "../middleware/multerconfig.js";
>>>>>>> origin/pdffeatures
import { imageToText } from "../controllers/imageToTextController.js";

const router = express.Router();

router.post(
  "/getText",
<<<<<<< HEAD

  singleFile,
=======
  uploadSingleImage,
>>>>>>> origin/pdffeatures
  imageToText
);

export default router;