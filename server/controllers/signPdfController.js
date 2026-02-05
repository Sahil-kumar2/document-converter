import path from "path";
import fs from "fs";
import { getBodyValue } from "../utils/bodyFields.js";
import { removeFiles } from "../utils/cleanup.js";
import { signPdf } from "../services/signPdfService.js";

/**
 * POST /api/pdf/sign
 * Body: pdfFile, signatureText or signatureImage (data URL), pageNumber, position/x/y
 */
export async function signPdfController(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: "PDF file is required (pdfFile)" });
  }

  const signatureText = getBodyValue(req.body, "signatureText");
  let signatureImage = getBodyValue(req.body, "signatureImage");
  let signatureImagePath = null;
  
  // If signatureImage was uploaded as a file, convert it to base64 data URL
  if (!signatureImage && req.files?.signatureImage?.[0]) {
    signatureImagePath = req.files.signatureImage[0].path;
    try {
      const imageBuffer = fs.readFileSync(signatureImagePath);
      const ext = path.extname(signatureImagePath).toLowerCase().slice(1); // jpg or png
      const mimeType = ext === "jpg" || ext === "jpeg" ? "jpeg" : "png";
      signatureImage = `data:image/${mimeType};base64,${imageBuffer.toString("base64")}`;
    } catch (error) {
      console.error("Error reading signature image:", error);
      return res.status(400).json({ success: false, error: "Failed to read signature image" });
    }
  }
  
  const pageNumber = parseInt(getBodyValue(req.body, "pageNumber") || "1", 10);
  const position = getBodyValue(req.body, "position") || undefined;
  const x = parseFloat(getBodyValue(req.body, "x"));
  const y = parseFloat(getBodyValue(req.body, "y"));
  const fontSize = parseFloat(getBodyValue(req.body, "fontSize"));
  const color = getBodyValue(req.body, "color");
  const width = parseFloat(getBodyValue(req.body, "width"));
  const height = parseFloat(getBodyValue(req.body, "height"));

  if (!signatureText && !signatureImage) {
    return res.status(400).json({
      success: false,
      error: "Provide signatureText or signatureImage",
    });
  }

  try {
    const outputPath = await signPdf(uploadedPath, {
      signatureText,
      signatureImage,
      pageNumber,
      position,
      x: Number.isFinite(x) ? x : undefined,
      y: Number.isFinite(y) ? y : undefined,
      fontSize: Number.isFinite(fontSize) ? fontSize : undefined,
      color: color || undefined,
      width: Number.isFinite(width) ? width : undefined,
      height: Number.isFinite(height) ? height : undefined,
    });

    const filename = path.basename(outputPath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.sendFile(path.resolve(outputPath), (err) => {
      const filesToRemove = [uploadedPath, outputPath];
      // Also remove signature image file if it was uploaded
      if (req.files?.signatureImage?.[0]?.path) {
        filesToRemove.push(req.files.signatureImage[0].path);
      }
      removeFiles(filesToRemove);
      if (err && !res.headersSent) next(err);
    });
  } catch (error) {
    const filesToRemove = [uploadedPath];
    // Also remove signature image file if it was uploaded
    if (req.files?.signatureImage?.[0]?.path) {
      filesToRemove.push(req.files.signatureImage[0].path);
    }
    removeFiles(filesToRemove);
    next(error);
  }
}
