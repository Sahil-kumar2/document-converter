import { PDFDocument, degrees } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { parsePageRanges } from '../utils/pageRangeParser.js';

const ALLOWED_ANGLES = [90, 180, 270];

/**
 * Rotate selected pages of a PDF by the given angle.
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{ rotationAngle: number, pageNumbers?: string }} options
 * @returns {Promise<{ path: string }>}
 */
async function rotatePdf(inputPath, options) {
  const { rotationAngle, pageNumbers } = options;

  if (!ALLOWED_ANGLES.includes(rotationAngle)) {
    throw new Error(`rotationAngle must be 90, 180, or 270 (got ${rotationAngle})`);
  }

  const buffer = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(buffer);
  const totalPages = doc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  let indices;
  if (pageNumbers && pageNumbers.trim()) {
    const parsed = parsePageRanges(pageNumbers, totalPages);
    if (parsed.error) throw new Error(parsed.error);
    if (parsed.indices.length === 0) throw new Error('No valid pages in pageNumbers');
    indices = parsed.indices;
  } else {
    indices = Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = doc.getPages();
  const angle = degrees(rotationAngle);
  for (const i of indices) {
    if (i >= pages.length) continue;
    pages[i].setRotation(angle);
  }

  const bytes = await doc.save();
  const outPath = path.join(path.dirname(inputPath), `rotate-${Date.now()}.pdf`);
  fs.writeFileSync(outPath, bytes);
  return { path: outPath };
}

export { rotatePdf };
