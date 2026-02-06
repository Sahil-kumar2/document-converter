import express from "express";
import { uploadAndLock } from "../controllers/lockDocumentController.js";
<<<<<<< HEAD
//import upload from "../utils/fileUtils.js";
import { singleFile } from "../middleware/upload.js";
const router = express.Router();

//router.post("/lockDocument",upload.single("file"), uploadAndLock );
router.post("/lockDocument", singleFile, uploadAndLock);
=======
import { uploadSingleFile } from "../middleware/multerconfig.js";
const router = express.Router();

router.post("/lockDocument", uploadSingleFile, uploadAndLock );
>>>>>>> origin/pdffeatures

export default router;


