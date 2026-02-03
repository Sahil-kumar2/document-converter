import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";
import { resolveSignaturePlacement } from "../utils/signaturePlacement.js";

const parseColor = (hex) => {
  if (!hex || typeof hex !== "string") return rgb(0, 0, 0);
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return rgb(0, 0, 0);
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
};

const decodeDataUrl = (dataUrl) => {
  const match = /^data:(image\/(png|jpeg|jpg));base64,(.+)$/i.exec(dataUrl || "");
  if (!match) return null;
  return {
    mime: match[1].toLowerCase(),
    buffer: Buffer.from(match[3], "base64"),
  };
};

/**
 * Sign a PDF with text or image using pdf-lib.
 * @param {string} inputPath
 * @param {{
 *  signatureText?: string,
 *  signatureImage?: string,
 *  pageNumber: number,
 *  position?: string,
 *  x?: number,
 *  y?: number,
 *  fontSize?: number,
 *  color?: string,
 *  width?: number,
 *  height?: number
 * }} options
 * @returns {Promise<string>}
 */
export async function signPdf(inputPath, options) {
  const {
    signatureText,
    signatureImage,
    pageNumber,
    position,
    x,
    y,
    fontSize = 24,
    color = "#000000",
    width,
    height,
  } = options;

  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  if (pageNumber < 1 || pageNumber > totalPages) {
    throw new Error(`Page number must be between 1 and ${totalPages}`);
  }

  const page = pdfDoc.getPage(pageNumber - 1);
  const { width: pageWidth, height: pageHeight } = page.getSize();

  if (signatureText) {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const textWidth = font.widthOfTextAtSize(signatureText, fontSize);
    const textHeight = fontSize;

    const placement = resolveSignaturePlacement({
      pageWidth,
      pageHeight,
      position,
      x,
      y,
      boxWidth: textWidth,
      boxHeight: textHeight,
    });

    page.drawText(signatureText, {
      x: placement.x,
      y: placement.y,
      size: fontSize,
      font,
      color: parseColor(color),
    });
  } else if (signatureImage) {
    const decoded = decodeDataUrl(signatureImage);
    if (!decoded) {
      throw new Error("signatureImage must be a base64 data URL (png or jpg)");
    }

    const image = decoded.mime.includes("png")
      ? await pdfDoc.embedPng(decoded.buffer)
      : await pdfDoc.embedJpg(decoded.buffer);

    const imgDims = image.scale(1);
    const drawWidth = width && width > 0 ? width : imgDims.width;
    const drawHeight = height && height > 0 ? height : imgDims.height;

    const placement = resolveSignaturePlacement({
      pageWidth,
      pageHeight,
      position,
      x,
      y,
      boxWidth: drawWidth,
      boxHeight: drawHeight,
    });

    page.drawImage(image, {
      x: placement.x,
      y: placement.y,
      width: drawWidth,
      height: drawHeight,
    });
  } else {
    throw new Error("Either signatureText or signatureImage is required");
  }

  const outputPath = path.join(
    path.dirname(inputPath),
    `signed-${Date.now()}.pdf`
  );

  const signedBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, signedBytes);

  return outputPath;
}
