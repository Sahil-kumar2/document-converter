import * as mergePdfService from "../services/mergePdfService.js";
import { removeFiles } from "../utils/cleanup.js";
import fs from "fs";
import path from "path";

export async function mergePdfs(req, res, next) {
  try {
    const uploadedFiles = req.files;

    if (!uploadedFiles || uploadedFiles.length < 2) {
      return res.status(400).json({
        success: false,
        error: "At least 2 PDF files are required (field name: pdfFiles)",
      });
    }

    const uploadedPaths = uploadedFiles.map((file) =>
      path.resolve(file.path)
    );

    // Validate extension
    for (const file of uploadedFiles) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".pdf") {
        await removeFiles(uploadedPaths);
        return res.status(400).json({
          success: false,
          error: "Only PDF files are allowed",
        });
      }
    }

    console.log("📂 Merging files:", uploadedPaths);

    const mergedPath = await mergePdfService.mergePdfs(uploadedPaths);

    if (!mergedPath || !fs.existsSync(mergedPath)) {
      await removeFiles(uploadedPaths);
      return res.status(500).json({
        success: false,
        error: "Merged file not created",
      });
    }

    const filename = path.basename(mergedPath);

    // Same pattern as convertFile
    return res.download(mergedPath, filename, async (err) => {
      if (err) {
        console.error("❌ Download error:", err);
      }

      // Cleanup AFTER response
      await removeFiles([...uploadedPaths, mergedPath]);
    });

  } catch (error) {
    console.error("❌ Merge error:", error);
    next(error);
  }
}
