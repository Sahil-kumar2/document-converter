import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { parsePageRanges } from '../utils/pageRangeParser.js';

/**
 * Crop PDF by setting crop box on selected pages.
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{ pageNumbers?: string, cropBox: { x: number, y: number, width: number, height: number } }} options
 * @returns {Promise<{ path: string }>}
 */
async function cropPdf(inputPath, options) {
  const { pageNumbers, cropBox } = options;
  const { x, y, width, height } = cropBox;

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error('cropBox must have numeric x, y, width, height; width and height must be positive');
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
  for (const i of indices) {
    if (i >= pages.length) continue;
    const page = pages[i];
    const mediaBox = page.getMediaBox();
    // Clamp crop box to media box
    const maxX = mediaBox.x + mediaBox.width;
    const maxY = mediaBox.y + mediaBox.height;
    const cx = Math.max(mediaBox.x, Math.min(x, maxX - 1));
    const cy = Math.max(mediaBox.y, Math.min(y, maxY - 1));
    const cw = Math.min(width, maxX - cx);
    const ch = Math.min(height, maxY - cy);
    page.setCropBox(cx, cy, cw, ch);
  }

  const bytes = await doc.save();
  const outPath = path.join(path.dirname(inputPath), `crop-${Date.now()}.pdf`);
  fs.writeFileSync(outPath, bytes);
  return { path: outPath };
}

export { cropPdf };
