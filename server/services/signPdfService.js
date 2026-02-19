// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// import fs from "fs";
// import path from "path";
// import { resolveSignaturePlacement } from "../utils/signaturePlacement.js";

// const parseColor = (hex) => {
//   if (!hex || typeof hex !== "string") return rgb(0, 0, 0);
//   const cleaned = hex.replace("#", "");
//   if (cleaned.length !== 6) return rgb(0, 0, 0);
//   const r = parseInt(cleaned.slice(0, 2), 16) / 255;
//   const g = parseInt(cleaned.slice(2, 4), 16) / 255;
//   const b = parseInt(cleaned.slice(4, 6), 16) / 255;
//   return rgb(r, g, b);
// };

// const decodeDataUrl = (dataUrl) => {
//   const match = /^data:(image\/(png|jpeg|jpg));base64,(.+)$/i.exec(dataUrl || "");
//   if (!match) return null;
//   return {
//     mime: match[1].toLowerCase(),
//     buffer: Buffer.from(match[3], "base64"),
//   };
// };

// /**
//  * Sign a PDF with text, drawn signature, or image
//  * @param {string} inputPath
//  * @param {{
//  *  signatureType: "text" | "draw" | "image",
//  *  signatureText?: string,
//  *  signatureImage?: string (base64 data URL),
//  *  pageNumber: number,
//  *  xRatio?: number (0-1),
//  *  yRatio?: number (0-1),
//  *  scale?: number (0-1),
//  *  fontSize?: number,
//  *  fontFamily?: string,
//  *  color?: string,
//  *  position?: string (legacy),
//  *  x?: number (legacy),
//  *  y?: number (legacy),
//  *  width?: number (legacy),
//  *  height?: number (legacy)
//  * }} options
//  * @returns {Promise<string>}
//  */
// export async function signPdf(inputPath, options) {
//   const {
//     signatureType = "text",
//     signatureText,
//     signatureImage,
//     pageNumber,
//     xRatio = 0.5,
//     yRatio = 0.5,
//     scale = 0.2,
//     fontSize = 24,
//     fontFamily = "cursive",
//     color = "#000000",
//     position,
//     x,
//     y,
//     width,
//     height,
//   } = options;

//   const pdfBytes = fs.readFileSync(inputPath);
//   const pdfDoc = await PDFDocument.load(pdfBytes);
//   const totalPages = pdfDoc.getPageCount();

//   if (pageNumber < 1 || pageNumber > totalPages) {
//     throw new Error(`Page number must be between 1 and ${totalPages}`);
//   }

//   const page = pdfDoc.getPage(pageNumber - 1);
//   const { width: pageWidth, height: pageHeight } = page.getSize();

//   if (signatureType === "text" && signatureText) {
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const textWidth = font.widthOfTextAtSize(signatureText, fontSize);
//     const textHeight = fontSize;

//     // Use ratio-based positioning if xRatio is provided, else fallback to legacy
//     let placement;
//     if (xRatio !== undefined && yRatio !== undefined) {
//       // Convert ratio to absolute position
//       const absoluteX = xRatio * pageWidth;
//       const absoluteY = (1 - yRatio) * pageHeight; // Invert Y (PDF Y increases bottom-to-top)
//       placement = {
//         x: absoluteX - textWidth / 2,
//         y: absoluteY - textHeight / 2,
//       };
//     } else {
//       // Legacy positioning
//       placement = resolveSignaturePlacement({
//         pageWidth,
//         pageHeight,
//         position,
//         x,
//         y,
//         boxWidth: textWidth,
//         boxHeight: textHeight,
//       });
//     }

//     page.drawText(signatureText, {
//       x: placement.x,
//       y: placement.y,
//       size: fontSize,
//       font,
//       color: parseColor(color),
//     });
//   } else if ((signatureType === "image" || signatureType === "draw") && signatureImage) {
//     const decoded = decodeDataUrl(signatureImage);
//     if (!decoded) {
//       throw new Error("signatureImage must be a base64 data URL (png or jpg)");
//     }

//     const image = decoded.mime.includes("png")
//       ? await pdfDoc.embedPng(decoded.buffer)
//       : await pdfDoc.embedJpg(decoded.buffer);

//     const imgDims = image.scale(1);
    
//     // Calculate dimensions based on scale ratio
//     const drawWidth = pageWidth * scale;
//     const drawHeight = pageHeight * scale * 0.5;

//     // Use ratio-based positioning
//     const absoluteX = xRatio * pageWidth;
//     const absoluteY = (1 - yRatio) * pageHeight; // Invert Y
//     const placement = {
//       x: absoluteX - drawWidth / 2,
//       y: absoluteY - drawHeight / 2,
//     };

//     page.drawImage(image, {
//       x: placement.x,
//       y: placement.y,
//       width: drawWidth,
//       height: drawHeight,
//     });
//   } else {
//     throw new Error("Either signatureText or signatureImage is required");
//   }

//   const outputPath = path.join(
//     path.dirname(inputPath),
//     `signed-${Date.now()}.pdf`
//   );

//   const signedBytes = await pdfDoc.save();
//   fs.writeFileSync(outputPath, signedBytes);

//   return outputPath;
// }



import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

const parseColor = (hex) => {
  if (!hex || typeof hex !== "string") return rgb(0, 0, 0);
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return rgb(0, 0, 0);
  return rgb(
    parseInt(cleaned.slice(0, 2), 16) / 255,
    parseInt(cleaned.slice(2, 4), 16) / 255,
    parseInt(cleaned.slice(4, 6), 16) / 255
  );
};

const decodeDataUrl = (dataUrl) => {
  const match = /^data:(image\/(png|jpeg|jpg));base64,(.+)$/i.exec(dataUrl || "");
  if (!match) return null;
  return {
    mime: match[1].toLowerCase(),
    buffer: Buffer.from(match[3], "base64"),
  };
};

export async function signPdf(inputPath, options) {
  const {
    signatureType = "text",
    signatureText,
    signatureImage,
    signatureScale = 0.25,
    positions = {},
    fontSize = 24,
    color = "#000000",
  } = options;

  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  const pages = pdfDoc.getPages();

  // 🔥 Loop through all positions
  for (const pageKey of Object.keys(positions)) {
    const pageIndex = parseInt(pageKey, 10) - 1;

    if (pageIndex < 0 || pageIndex >= totalPages) continue;

    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const { x: xRatio = 0.5, y: yRatio = 0.5 } = positions[pageKey];

    if (signatureType === "text" && signatureText) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const textWidth = font.widthOfTextAtSize(signatureText, fontSize);
      const textHeight = fontSize;

      const absoluteX = xRatio * pageWidth;
      const absoluteY = (1 - yRatio) * pageHeight;

      page.drawText(signatureText, {
        x: absoluteX - textWidth / 2,
        y: absoluteY - textHeight / 2,
        size: fontSize,
        font,
        color: parseColor(color),
      });

    } else if ((signatureType === "image" || signatureType === "draw") && signatureImage) {

      const decoded = decodeDataUrl(signatureImage);
      if (!decoded) {
        throw new Error("Invalid base64 signature image");
      }

      const image = decoded.mime.includes("png")
        ? await pdfDoc.embedPng(decoded.buffer)
        : await pdfDoc.embedJpg(decoded.buffer);

      const drawWidth = pageWidth * signatureScale;
      const drawHeight = pageHeight * signatureScale * 0.5;

      const absoluteX = xRatio * pageWidth;
      const absoluteY = (1 - yRatio) * pageHeight;

      page.drawImage(image, {
        x: absoluteX - drawWidth / 2,
        y: absoluteY - drawHeight / 2,
        width: drawWidth,
        height: drawHeight,
      });
    }
  }

  const outputPath = path.join(
    path.dirname(inputPath),
    `signed-${Date.now()}.pdf`
  );

  const signedBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, signedBytes);

  return outputPath;
}
