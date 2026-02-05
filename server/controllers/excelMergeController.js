import fs from "fs/promises";
import { mergeExcelFiles } from "../services/excelServices.js";

export async function mergeExcelController(req, res) {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 Excel files are required"
      });
    }

    const filePaths = req.files.map(f => f.path);

    const outputPath = mergeExcelFiles(filePaths);

    // 🔥 DELETE TEMP FILES AFTER SUCCESS
    await Promise.all(
      filePaths.map(p => fs.unlink(p))
    );

    res.json({
      success: true,
      message: "Excel files merged successfully",
      file: outputPath
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
