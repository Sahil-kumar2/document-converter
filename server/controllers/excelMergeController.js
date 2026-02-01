import { mergeExcelFiles } from "../services/excelServices.js";

export function mergeExcelController(req, res) {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 Excel files are required"
      });
    }

    const filePaths = req.files.map(file => file.path);

    const outputPath = mergeExcelFiles(filePaths);

    res.json({
      success: true,
      message: "Excel files merged successfully",
      file: outputPath
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
