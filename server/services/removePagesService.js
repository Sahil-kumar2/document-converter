import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';
import { parsePageRanges } from '../utils/pageRangeParser.js';

/**
 * Remove specified pages from PDF using pdf-lib
 * @param {string} inputPath - Path to input PDF
 * @param {string} pageRanges - Pages to remove (e.g., "1,3,5-7")
 * @returns {Promise<string>} - Path to output PDF
 */
export async function removePages(inputPath, pageRanges) {
  if (!pageRanges || pageRanges.trim() === '') {
    throw new Error('Page ranges are required');
  }
  
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();
  
  // Parse page ranges to get indices (0-based)
  const { indices, error } = parsePageRanges(pageRanges, totalPages);
  
  if (error) {
    throw new Error(error);
  }
  
  // Create a set of pages to remove for fast lookup
  const pagesToRemove = new Set(indices);
  
  // Create new PDF with pages not in removal list
  const newPdf = await PDFDocument.create();
  const pageIndices = Array.from({ length: totalPages }, (_, i) => i);
  const pagesToKeep = pageIndices.filter(i => !pagesToRemove.has(i));
  
  if (pagesToKeep.length === 0) {
    throw new Error('Cannot remove all pages from PDF');
  }
  
  const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep);
  copiedPages.forEach((page) => newPdf.addPage(page));
  
  const outputPath = path.join(
    path.dirname(inputPath),
    `removed-pages-${Date.now()}.pdf`
  );
  
  const newPdfBytes = await newPdf.save();
  fs.writeFileSync(outputPath, newPdfBytes);
  
  return outputPath;
}
