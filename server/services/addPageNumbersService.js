import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Add page numbers to PDF
 * @param {string} inputPath - Path to uploaded PDF
 * @param {Object} options - Configuration options
 * @returns {Promise<{ path: string }>}
 */
async function addPageNumbers(inputPath, options = {}) {
  const buffer = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(buffer);
  const pages = doc.getPages();
  const totalPages = pages.length;

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  // ==============================
  // OPTIONS
  // ==============================
  const {
    position = 'bottom-right',
    margin = 'medium',
    startPage = 1,
    endPage = totalPages,
    textContent = '{page}',
    fontSize = 12,
    bold = false,
    italic = false,
    underline = false,
    textColor = '#000000',
  } = options;

  // ==============================
  // POSITION PARSE
  // ==============================
  const [vPos = 'bottom', hPos = 'right'] = position.split('-');

  // ==============================
  // COLOR PARSE
  // ==============================
  const hex = textColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const color = rgb(r, g, b);

  // ==============================
  // MARGIN MAP
  // ==============================
  const marginMap = {
    recommended: fontSize * 1.5,
    small: fontSize * 0.5,
    medium: fontSize * 1,
    large: fontSize * 2.5,
  };
  const marginPoints = marginMap[margin] || marginMap.medium;

  // ==============================
  // FONT EMBED (FIXED)
  // ==============================
  let font;
  if (bold && italic) {
    font = await doc.embedFont(StandardFonts.HelveticaBoldOblique);
  } else if (bold) {
    font = await doc.embedFont(StandardFonts.HelveticaBold);
  } else if (italic) {
    font = await doc.embedFont(StandardFonts.HelveticaOblique);
  } else {
    font = await doc.embedFont(StandardFonts.Helvetica);
  }

  // ==============================
  // SAFE RANGE
  // ==============================
  const safeStart = Math.max(1, startPage);
  const safeEnd = Math.min(endPage, totalPages);

  // ==============================
  // PROCESS PAGES
  // ==============================
  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;

    if (pageNum < safeStart || pageNum > safeEnd) continue;

    const page = pages[i];
    const { width, height } = page.getSize();

    // Replace variables
    const pageText = textContent
      .replace(/{page}/g, pageNum)
      .replace(/{total}/g, totalPages);

    // Accurate measurement
    const textWidth = font.widthOfTextAtSize(pageText, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x, y;

    // Vertical
    if (vPos === 'top') {
      y = height - marginPoints - textHeight;
    } else if (vPos === 'middle') {
      y = height / 2 - textHeight / 2;
    } else {
      y = marginPoints;
    }

    // Horizontal
    if (hPos === 'left') {
      x = marginPoints;
    } else if (hPos === 'center') {
      x = width / 2 - textWidth / 2;
    } else {
      x = width - marginPoints - textWidth;
    }

    // ==============================
    // DRAW TEXT
    // ==============================
    page.drawText(pageText, {
      x,
      y,
      size: fontSize,
      font,
      color,
    });

    // ==============================
    // UNDERLINE SUPPORT
    // ==============================
    if (underline) {
      const underlineY = y - 2;
      page.drawLine({
        start: { x, y: underlineY },
        end: { x: x + textWidth, y: underlineY },
        thickness: Math.max(1, fontSize / 15),
        color,
      });
    }
  }

  // ==============================
  // SAVE
  // ==============================
  const bytes = await doc.save();
  const outPath = path.join(
    path.dirname(inputPath),
    `numbered-${Date.now()}.pdf`
  );

  fs.writeFileSync(outPath, bytes);

  return { path: outPath };
}

export { addPageNumbers };
