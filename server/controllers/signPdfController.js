// import path from "path";
// import fs from "fs";
// import { getBodyValue } from "../utils/bodyFields.js";
// import { removeFiles } from "../utils/cleanup.js";
// import { signPdf } from "../services/signPdfService.js";

// /**
//  * POST /api/pdf/sign
//  * Body: pdfFile, signatureType (text|draw|image)
//  * For text: signatureText, fontSize, fontFamily, color
//  * For image/draw: signatureImage (base64 or uploaded file)
//  * Position: xRatio, yRatio, scale (all 0-1 normalized)
//  * pageNumber: page to sign
//  */
// export async function signPdfController(req, res, next) {
//   const uploadedPath = req.file?.path;
//   if (!uploadedPath) {
//     return res.status(400).json({ success: false, error: "PDF file is required (pdfFile)" });
//   }

//   const signatureType = getBodyValue(req.body, "signatureType") || "text";
//   const signatureText = getBodyValue(req.body, "signatureText");
//   let signatureImage = getBodyValue(req.body, "signatureImage");
//   let signatureImagePath = null;
  
//   // If signatureImage was uploaded as a file, convert it to base64 data URL
//   if (!signatureImage && req.files?.signatureImage?.[0]) {
//     signatureImagePath = req.files.signatureImage[0].path;
//     try {
//       const imageBuffer = fs.readFileSync(signatureImagePath);
//       const ext = path.extname(signatureImagePath).toLowerCase().slice(1); // jpg or png
//       const mimeType = ext === "jpg" || ext === "jpeg" ? "jpeg" : "png";
//       signatureImage = `data:image/${mimeType};base64,${imageBuffer.toString("base64")}`;
//     } catch (error) {
//       console.error("Error reading signature image:", error);
//       return res.status(400).json({ success: false, error: "Failed to read signature image" });
//     }
//   }
  
//   const pageNumber = parseInt(getBodyValue(req.body, "pageNumber") || "1", 10);
//   const xRatio = parseFloat(getBodyValue(req.body, "xRatio") || "0.5");
//   const yRatio = parseFloat(getBodyValue(req.body, "yRatio") || "0.5");
//   const scale = parseFloat(getBodyValue(req.body, "scale") || "0.2");
  
//   // Text signature properties
//   const fontSize = parseFloat(getBodyValue(req.body, "fontSize") || "24");
//   const fontFamily = getBodyValue(req.body, "fontFamily") || "cursive";
//   const color = getBodyValue(req.body, "color") || "#000000";
  
//   // Backward compat: old position/x/y/width/height fields
//   const position = getBodyValue(req.body, "position") || undefined;
//   const x = parseFloat(getBodyValue(req.body, "x"));
//   const y = parseFloat(getBodyValue(req.body, "y"));
//   const width = parseFloat(getBodyValue(req.body, "width"));
//   const height = parseFloat(getBodyValue(req.body, "height"));

//   if (signatureType === "text" && !signatureText) {
//     return res.status(400).json({
//       success: false,
//       error: "signatureText is required for text signatures",
//     });
//   }

//   if ((signatureType === "image" || signatureType === "draw") && !signatureImage) {
//     return res.status(400).json({
//       success: false,
//       error: "signatureImage is required for image/draw signatures",
//     });
//   }

//   try {
//     const outputPath = await signPdf(uploadedPath, {
//       signatureType,
//       signatureText,
//       signatureImage,
//       pageNumber,
//       xRatio,
//       yRatio,
//       scale,
//       fontSize,
//       fontFamily,
//       color,
//       // Backward compat
//       position,
//       x: Number.isFinite(x) ? x : undefined,
//       y: Number.isFinite(y) ? y : undefined,
//       width: Number.isFinite(width) ? width : undefined,
//       height: Number.isFinite(height) ? height : undefined,
//     });

//     res.download(outputPath, "signed.pdf", (err) => {
//       const filesToRemove = [uploadedPath, outputPath];
//       // Also remove signature image file if it was uploaded
//       if (signatureImagePath) {
//         filesToRemove.push(signatureImagePath);
//       }
//       removeFiles(filesToRemove);
//       if (err && !res.headersSent) next(err);
//     });
//   } catch (error) {
//     const filesToRemove = [uploadedPath];
//     // Also remove signature image file if it was uploaded
//     if (signatureImagePath) {
//       filesToRemove.push(signatureImagePath);
//     }
//     removeFiles(filesToRemove);
//     next(error);
//   }
// }


import path from "path";
import fs from "fs";
import { getBodyValue } from "../utils/bodyFields.js";
import { removeFiles } from "../utils/cleanup.js";
import { signPdf } from "../services/signPdfService.js";

/**
 * POST /api/pdf/sign
 * Supports:
 *  - Multiple pages via positions object
 *  - Text / Image signature
 */
export async function signPdfController(req, res, next) {
 const uploadedPath =
  req.files?.pdfFile?.[0]?.path ||
  req.file?.path;
console.log("------ DEBUG START ------");
console.log("signatureType:", req.body.signatureType);
console.log("FILES:", req.files);
console.log("BODY:", req.body);
console.log("------ DEBUG END ------");


  if (!uploadedPath) {
    return res.status(400).json({
      success: false,
      error: "PDF file is required (pdfFile)",
    });
  }

  const signatureType = getBodyValue(req.body, "signatureType") || "text";
  const signatureText = getBodyValue(req.body, "signatureText");
  const signatureScale = parseFloat(getBodyValue(req.body, "signatureScale") || "0.25");

  let positions = getBodyValue(req.body, "positions");

  // If positions is string (multipart form), parse it
  if (typeof positions === "string") {
    try {
      positions = JSON.parse(positions);
    } catch {
      positions = {};
    }
  }

  if (!positions || typeof positions !== "object") {
    positions = {};
  }

  let signatureImage = getBodyValue(req.body, "signatureImage");
  let signatureImagePath = null;

  // If signature image uploaded as file
  if (!signatureImage && req.files?.signatureImage?.[0]) {
    signatureImagePath = req.files.signatureImage[0].path;

    try {
      const imageBuffer = fs.readFileSync(signatureImagePath);
      const ext = path.extname(signatureImagePath).toLowerCase().slice(1);
      const mimeType = ext === "jpg" || ext === "jpeg" ? "jpeg" : "png";

      signatureImage = `data:image/${mimeType};base64,${imageBuffer.toString("base64")}`;
    } catch (error) {
      removeFiles([uploadedPath, signatureImagePath]);
      return res.status(400).json({
        success: false,
        error: "Failed to read signature image",
      });
    }
  }

  // Validation
  if (signatureType === "text" && !signatureText) {
    removeFiles([uploadedPath]);
    return res.status(400).json({
      success: false,
      error: "signatureText is required for text signature",
    });
  }

  if ((signatureType === "image" || signatureType === "draw") && !signatureImage) {
    removeFiles([uploadedPath]);
    return res.status(400).json({
      success: false,
      error: "signatureImage is required for image signature",
    });
  }

  try {
    /**
     * signPdf service should now:
     *  - Loop through positions object
     *  - Apply signature on each page
     */
    const outputPath = await signPdf(uploadedPath, {
      signatureType,
      signatureText,
      signatureImage,
      signatureScale,
      positions, // 🔥 MULTI PAGE POSITIONS
    });

    res.download(outputPath, "signed.pdf", (err) => {
      const filesToRemove = [uploadedPath, outputPath];
      if (signatureImagePath) filesToRemove.push(signatureImagePath);

      removeFiles(filesToRemove);

      if (err && !res.headersSent) next(err);
    });

  } catch (error) {
    const filesToRemove = [uploadedPath];
    if (signatureImagePath) filesToRemove.push(signatureImagePath);

    removeFiles(filesToRemove);
    next(error);
  }
}

