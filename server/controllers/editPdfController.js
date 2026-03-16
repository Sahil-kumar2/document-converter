import fs from "fs";
import path from "path";
import { editPdf } from "../services/editPdfService.js";
import { deleteFile } from "../middleware/multerconfig.js";

export const editPdfController = async (req, res) => {
  let outputPath;

  try {
    // ===============================
    // 1. Validate file
    // ===============================
    if (!req.file) {
      return res.status(400).json({
        error: "PDF file is required",
      });
    }

    const inputPath = req.file.path;

    // ===============================
    // 2. Validate elements
    // ===============================
    if (!req.body.elements) {
      await deleteFile(inputPath);
      return res.status(400).json({
        error: "No edit elements provided",
      });
    }

    // ===============================
    // 3. Safe JSON parse
    // ===============================
    let parsedElements;

    try {
      parsedElements = JSON.parse(req.body.elements);

      if (!Array.isArray(parsedElements)) {
        throw new Error("Elements must be an array");
      }
    } catch (err) {
      await deleteFile(inputPath);
      return res.status(400).json({
        error: "Invalid elements format",
      });
    }

    // ===============================
    // 4. Call service
    // ===============================
    outputPath = await editPdf(inputPath, parsedElements);

    // ===============================
    // 5. Verify output exists
    // ===============================
    if (!outputPath || !fs.existsSync(outputPath)) {
      await deleteFile(inputPath);
      return res.status(500).json({
        error: "Failed to generate edited PDF",
      });
    }

    // ===============================
    // 6. Send file with proper headers
    // ===============================
    const filename = "edited.pdf";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.sendFile(path.resolve(outputPath), async (err) => {
      // Cleanup uploaded + output files
      await deleteFile(inputPath);
      await deleteFile(outputPath);

      if (err && !res.headersSent) {
        console.error("Download error:", err);
      }
    });

  } catch (error) {
    console.error("❌ editPdfController error:", error);

    // cleanup safety
    if (req.file?.path) await deleteFile(req.file.path);
    if (outputPath) await deleteFile(outputPath);

    return res.status(500).json({
      error: "Failed to edit PDF",
    });
  }
};