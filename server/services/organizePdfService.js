import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import { parsePageRanges } from "../utils/pageRangeParser.js";

/**
 * Organize PDF by reorder or delete pages.
 * @param {string} inputPath
 * @param {{ pageOrder?: number[], pagesToRemove?: string }} options
 * @returns {Promise<string>}
 */
export async function organizePdf(inputPath, options) {
  const { pageOrder, pagesToRemove } = options || {};
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  let orderedIndices = null;

  if (Array.isArray(pageOrder) && pageOrder.length > 0) {
    const seen = new Set();
    const indices = pageOrder.map((p) => Number(p) - 1);

    for (const idx of indices) {
      if (!Number.isInteger(idx) || idx < 0 || idx >= totalPages) {
        throw new Error(`Page order contains out-of-range value`);
      }
      if (seen.has(idx)) {
        throw new Error(`Page order contains duplicates`);
      }
      seen.add(idx);
    }

    orderedIndices = indices;
  } else if (pagesToRemove) {
    const { indices, error } = parsePageRanges(pagesToRemove, totalPages);
    if (error) throw new Error(error);

    const removeSet = new Set(indices);
    orderedIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
      (i) => !removeSet.has(i)
    );

    if (orderedIndices.length === 0) {
      throw new Error("Cannot remove all pages from PDF");
    }
  } else {
    throw new Error("Either pageOrder or pagesToRemove is required");
  }

  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdfDoc, orderedIndices);
  pages.forEach((p) => newPdf.addPage(p));

  const outputPath = path.join(
    path.dirname(inputPath),
    `organized-${Date.now()}.pdf`
  );

  const bytes = await newPdf.save();
  fs.writeFileSync(outputPath, bytes);

  return outputPath;
}
