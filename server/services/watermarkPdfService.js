import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { parsePageRanges } from '../utils/pageRangeParser.js';

const DEFAULT_FONT_SIZE = 48;
const DEFAULT_OPACITY = 0.3;
const DEFAULT_SCALE = 0.3;
const VALID_POSITIONS = [
  'center',
  'top',
  'bottom',
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const parseHexColor = (color) => {
  if (!color || typeof color !== 'string') return rgb(0.4, 0.4, 0.4);
  const hex = color.replace('#', '').trim();
  if (hex.length !== 6) return rgb(0.4, 0.4, 0.4);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return rgb(0.4, 0.4, 0.4);
  return rgb(r / 255, g / 255, b / 255);
};

const resolveFontName = (fontFamily, bold, italic) => {
  const family = String(fontFamily || 'Helvetica').toLowerCase();
  const isBold = Boolean(bold);
  const isItalic = Boolean(italic);

  if (family.includes('times')) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (family.includes('courier')) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
};

const getPositionFromPreset = (pos, pageWidth, pageHeight, wmWidth, wmHeight) => {
  const marginX = pageWidth * 0.05;
  const marginY = pageHeight * 0.05;
  const position = String(pos || 'center').toLowerCase().trim();

  let x = (pageWidth - wmWidth) / 2;
  let y = (pageHeight - wmHeight) / 2;

  if (position.includes('left')) x = marginX;
  if (position.includes('right')) x = pageWidth - wmWidth - marginX;

  if (position.includes('top')) y = pageHeight - wmHeight - marginY;
  if (position.includes('bottom')) y = marginY;

  if (position === 'top') {
    y = pageHeight - wmHeight - marginY;
  }
  if (position === 'bottom') {
    y = marginY;
  }

  return {
    x: clamp(x, 0, Math.max(0, pageWidth - wmWidth)),
    y: clamp(y, 0, Math.max(0, pageHeight - wmHeight)),
  };
};

const getPositionFromRatios = (xRatio, yRatio, pageWidth, pageHeight, wmWidth, wmHeight) => {
  const centerX = (xRatio ?? 0.5) * pageWidth;
  const centerYFromTop = (yRatio ?? 0.5) * pageHeight;
  const rawX = centerX - wmWidth / 2;
  const rawYTop = centerYFromTop - wmHeight / 2;
  const x = clamp(rawX, 0, Math.max(0, pageWidth - wmWidth));
  const yTop = clamp(rawYTop, 0, Math.max(0, pageHeight - wmHeight));
  const y = pageHeight - yTop - wmHeight;
  return { x, y };
};

const resolveTargetIndices = (totalPages, pageScope, pageNumber, pageNumbers) => {
  if (pageScope === 'current') {
    const idx = clamp((pageNumber || 1) - 1, 0, totalPages - 1);
    return [idx];
  }

  if (pageNumbers && pageNumbers.trim()) {
    const parsed = parsePageRanges(pageNumbers, totalPages);
    if (parsed.error) throw new Error(parsed.error);
    if (parsed.indices.length === 0) throw new Error('No valid pages in pageNumbers');
    return parsed.indices;
  }

  return Array.from({ length: totalPages }, (_, i) => i);
};

const isPngBuffer = (buffer) =>
  buffer && buffer.length >= 8 &&
  buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

/**
 * Add text or image watermark to selected pages.
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{
 *  type?: 'text'|'image',
 *  watermarkText?: string,
 *  position?: string,
 *  opacity?: number,
 *  fontSize?: number,
 *  pageNumbers?: string,
 *  xRatio?: number,
 *  yRatio?: number,
 *  scale?: number,
 *  rotation?: number,
 *  pageScope?: 'all'|'current',
 *  pageNumber?: number,
 *  imagePath?: string,
 *  fontFamily?: string,
 *  fontColor?: string,
 *  bold?: boolean,
 *  italic?: boolean,
 * }} options
 * @returns {Promise<{ path: string }>}
 */
async function watermarkPdf(inputPath, options) {
  const {
    type = 'text',
    watermarkText,
    position = 'center',
    opacity = DEFAULT_OPACITY,
    fontSize = DEFAULT_FONT_SIZE,
    pageNumbers,
    xRatio,
    yRatio,
    scale = DEFAULT_SCALE,
    rotation = 0,
    pageScope = 'all',
    pageNumber = 1,
    imagePath,
    fontFamily = 'Helvetica',
    fontColor = '#666666',
    bold = false,
    italic = false,
  } = options;

  const opac = parseFloat(String(opacity));
  if (Number.isNaN(opac) || opac < 0 || opac > 1) {
    throw new Error('opacity must be a number between 0 and 1');
  }

  const fsNum = parseInt(String(fontSize), 10);
  const finalFontSize = Number.isNaN(fsNum) || fsNum < 8 ? DEFAULT_FONT_SIZE : Math.min(fsNum, 200);

  const buffer = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(buffer);
  const totalPages = doc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  const indices = resolveTargetIndices(totalPages, pageScope, pageNumber, pageNumbers);
  const pages = doc.getPages();
  const pos = (position || 'center').toLowerCase().trim();
  const useRatios = typeof xRatio === 'number' && typeof yRatio === 'number';

  if (type === 'image') {
    if (!imagePath) {
      throw new Error('watermarkImage is required for image watermark');
    }

    const imageBytes = fs.readFileSync(imagePath);
    const image = isPngBuffer(imageBytes)
      ? await doc.embedPng(imageBytes)
      : await doc.embedJpg(imageBytes);

    const imgWidth = image.width;
    const imgHeight = image.height;
    const finalScale = parseFloat(String(scale));
    if (Number.isNaN(finalScale) || finalScale <= 0 || finalScale > 1) {
      throw new Error('scale must be a number between 0 and 1');
    }

    for (const i of indices) {
      if (i >= pages.length) continue;
      const page = pages[i];
      const { width, height } = page.getSize();

      const targetWidth = width * finalScale;
      const targetHeight = targetWidth * (imgHeight / imgWidth);

      const { x, y } = useRatios
        ? getPositionFromRatios(xRatio, yRatio, width, height, targetWidth, targetHeight)
        : getPositionFromPreset(pos, width, height, targetWidth, targetHeight);

      page.drawImage(image, {
        x,
        y,
        width: targetWidth,
        height: targetHeight,
        opacity: opac,
        rotate: degrees(rotation || 0),
      });
    }
  } else {
    if (!watermarkText || typeof watermarkText !== 'string' || !watermarkText.trim()) {
      throw new Error('watermarkText is required and must not be empty');
    }

    if (!VALID_POSITIONS.includes(pos) && !useRatios) {
      throw new Error(`position must be one of: ${VALID_POSITIONS.join(', ')}`);
    }

    const fontName = resolveFontName(fontFamily, bold, italic);
    const font = await doc.embedFont(fontName);
    const text = watermarkText.trim();
    const textWidth = font.widthOfTextAtSize(text, finalFontSize);
    const textHeight = font.heightAtSize ? font.heightAtSize(finalFontSize) : finalFontSize;
    const color = parseHexColor(fontColor);

    for (const i of indices) {
      if (i >= pages.length) continue;
      const page = pages[i];
      const { width, height } = page.getSize();

      const { x, y } = useRatios
        ? getPositionFromRatios(xRatio, yRatio, width, height, textWidth, textHeight)
        : getPositionFromPreset(pos, width, height, textWidth, textHeight);

      page.drawText(text, {
        x,
        y,
        size: finalFontSize,
        font,
        color,
        opacity: opac,
        rotate: degrees(rotation || 0),
      });
    }
  }

  const bytes = await doc.save();
  const outPath = path.join(path.dirname(inputPath), `watermark-${Date.now()}.pdf`);
  fs.writeFileSync(outPath, bytes);
  return { path: outPath };
}

export { watermarkPdf };
