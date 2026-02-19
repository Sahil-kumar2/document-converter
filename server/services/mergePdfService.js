import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

/**
 * Merge multiple PDFs into one using pdf-lib
 * @param {string[]} inputPaths - Array of paths to input PDFs (in order)
 * @returns {Promise<string>} - Path to merged PDF
 */export async function mergePdfs(inputPaths) {
  if (!inputPaths || inputPaths.length < 2) {
    throw new Error('At least 2 PDF files are required for merging');
  }

  const mergedPdf = await PDFDocument.create();

  for (const inputPath of inputPaths) {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const outputDir = path.resolve("outputs");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(
    outputDir,
    `merged-${Date.now()}.pdf`
  );

  const mergedPdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedPdfBytes);

  return outputPath;
}