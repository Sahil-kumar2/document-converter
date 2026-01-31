import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { parsePageRanges } from '../utils/pageRangeParser.js';

const DEFAULT_FONT_SIZE = 48;
const DEFAULT_OPACITY = 0.3;
const VALID_POSITIONS = ['center', 'top', 'bottom'];

// Approximate char width ratio for Helvetica (empirically ~0.55–0.6)
const CHAR_WIDTH_RATIO = 0.58;

/**
 * Add text watermark to selected pages.
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{ watermarkText: string, position?: string, opacity?: number, fontSize?: number, pageNumbers?: string }} options
 * @returns {Promise<{ path: string }>}
 */
async function watermarkPdf(inputPath, options) {
  const {
    watermarkText,
    position = 'center',
    opacity = DEFAULT_OPACITY,
    fontSize = DEFAULT_FONT_SIZE,
    pageNumbers,
  } = options;

  if (!watermarkText || typeof watermarkText !== 'string' || !watermarkText.trim()) {
    throw new Error('watermarkText is required and must not be empty');
  }

  const opac = parseFloat(String(opacity));
  if (Number.isNaN(opac) || opac < 0 || opac > 1) {
    throw new Error('opacity must be a number between 0 and 1');
  }

  const pos = (position || 'center').toLowerCase().trim();
  if (!VALID_POSITIONS.includes(pos)) {
    throw new Error(`position must be one of: ${VALID_POSITIONS.join(', ')}`);
  }

  const fsNum = parseInt(String(fontSize), 10);
  const finalFontSize = Number.isNaN(fsNum) || fsNum < 8 ? DEFAULT_FONT_SIZE : Math.min(fsNum, 200);

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

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const textWidth = watermarkText.length * finalFontSize * CHAR_WIDTH_RATIO;

  const pages = doc.getPages();
  for (const i of indices) {
    if (i >= pages.length) continue;
    const page = pages[i];
    const { width, height } = page.getSize();

    // Compute x,y based on position (PDF origin is bottom-left)
    let x, y;
    if (pos === 'center') {
      x = (width - textWidth) / 2;
      y = (height - finalFontSize) / 2;
    } else if (pos === 'top') {
      x = (width - textWidth) / 2;
      y = height - finalFontSize - 50;
    } else {
      // bottom
      x = (width - textWidth) / 2;
      y = 50;
    }

    page.drawText(watermarkText.trim(), {
      x: Math.max(0, x),
      y: Math.max(0, y),
      size: finalFontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: opac,
    });
  }

  const bytes = await doc.save();
  const outPath = path.join(path.dirname(inputPath), `watermark-${Date.now()}.pdf`);
  fs.writeFileSync(outPath, bytes);
  return { path: outPath };
}

export { watermarkPdf };
