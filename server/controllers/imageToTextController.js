
import { extractTextFromImage } from "../services/ocr_services.js";
import fs from "fs";

export async function imageToText(req, res) {
  try {
    const originalPath = req.file.path;
    const txtFilePath = await extractTextFromImage(originalPath);
    
    // Send the text file for download
    res.download(txtFilePath, "extracted-text.txt", (err) => {
      if (err) {
        console.error("Download error:", err);
      }
      
      // Clean up uploaded image and text file after download
      setTimeout(() => {
        try {
          if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
          if (fs.existsSync(txtFilePath)) fs.unlinkSync(txtFilePath);
        } catch (cleanupErr) {
          console.error("Cleanup error:", cleanupErr);
        }
      }, 5000);
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}