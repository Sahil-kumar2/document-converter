
import { extractTextFromImage } from "../services/ocr_services.js";

export async function imageToText(req, res) {
  try {
    const originalPath = req.file.path;
    const txtFilePath = await extractTextFromImage(originalPath);
    
    res.json({
      success: true,
      message: "Text extracted and saved",
      textFile: txtFilePath
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}