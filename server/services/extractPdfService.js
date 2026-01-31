import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { parsePageRanges } from '../utils/pageRangeParser.js';

/**
 * Extract selected pages into a new PDF.
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{ pageNumbers: string }} options - e.g. "2,4,6-8"
 * @returns {Promise<{ path: string, pageCount: number }>}
 */
async function extractPdf(inputPath, options) {
  const { pageNumbers } = options;

  if (!pageNumbers || typeof pageNumbers !== 'string' || !pageNumbers.trim()) {
    throw new Error('pageNumbers is required (e.g. "2,4,6-8")');
  }

  const buffer = fs.readFileSync(inputPath);
  const srcDoc = await PDFDocument.load(buffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  const { indices, error } = parsePageRanges(pageNumbers, totalPages);
  if (error) throw new Error(error);
  if (indices.length === 0) {
    throw new Error('No valid pages in pageNumbers');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, indices);
  copiedPages.forEach((p) => newDoc.addPage(p));
  const bytes = await newDoc.save();
  const outPath = path.join(path.dirname(inputPath), `extract-${Date.now()}.pdf`);
  fs.writeFileSync(outPath, bytes);
  return { path: outPath, pageCount: indices.length };
}

export { extractPdf };
