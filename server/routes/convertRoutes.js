import express from "express";
//import { uploadSingleFile } from "../middleware/multerconfig.js";
import { uploadMultipleFiles } from "../middleware/multerconfig.js";
import { convertFile } from "../controllers/convertController.js";

const router = express.Router();

router.post("/",  uploadMultipleFiles, convertFile);

export default router;