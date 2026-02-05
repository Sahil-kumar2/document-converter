import path from "path";
import fs from "fs";

import { lockPdf, zipFile } from "../services/lockDocumentService.js";

export const uploadAndLock = async (req, res) => {
  try {
    console.log("📥 Upload hit");

    const { password } = req.body;
    const file = req.file;

    console.log("File:", file?.path);
    console.log("Password exists:", !!password);

    if (!file || !password) {
      return res.status(400).json({ message: "File & password required" });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    console.log("Extension:", ext);

    let outputFile;

    if (ext === ".pdf") {
      console.log("🔒 PDF flow");
      outputFile = await lockPdf(file.path, password);
    } else {
      console.log("📦 ZIP flow");
      outputFile = await zipFile(file.path, password);
    }

    console.log("✅ Output:", outputFile);

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Send the file as download instead of JSON
    res.download(outputFile, path.basename(outputFile), (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        return res.status(500).json({ error: "Failed to download file" });
      }
      
      // Clean up output file after download
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
    });
  } catch (err) {
    console.error("❌ Controller error:", err);
    return res.status(500).json({ error: err.message });
  }
};
