import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

/**
 * Unlock password-protected PDF
 * @param {string} inputPath
 * @param {{ password: string }} options
 * @returns {Promise<string>} outputPath
 */
export async function unlockPdf(inputPath, options = {}) {
  const { password } = options;

  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }

  const pdfBytes = fs.readFileSync(inputPath);

  let pdfDoc;

  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { password });
  } catch {
    throw new Error("Invalid password or protected PDF");
  }

  const outputPath = path.join(
    path.dirname(inputPath),
    `unlocked-${Date.now()}.pdf`
  );

  const unlockedBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, unlockedBytes);

  return outputPath;
}

