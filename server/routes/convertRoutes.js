import express from "express";
import upload from "../middleware/upload.js";
import { convertFile } from "../controllers/convertController.js";

const router = express.Router();

router.post("/", (req, res, next) => {
  console.log(" /api/convert route hit");
  next();
}, upload.single("file"), convertFile);

export default router;