import { convertToBlackWhite } from "../services/blackAndWhiteServices.js";
import path from "path";
import fs from "fs";

export async function blackWhiteController(req, res) {
  try {
    const originalPath = req.file.path;

    const processedPath = await convertToBlackWhite(originalPath);

    // Send the file for download
    res.download(processedPath, "black-white-image.jpg", (err) => {
      if (err) {
        console.error("Download error:", err);
      }
      
      // Clean up uploaded and processed files after download
      setTimeout(() => {
        try {
          if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
          if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
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
