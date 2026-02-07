import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { parsePageRanges } from '../utils/pageRangeParser.js';
import { parseRedactAreas } from '../utils/redactAreasParser.js';
import { flattenPdf } from '../utils/ghostscript.js';
import * as pdfaPdfService from './pdfaPdfService.js';

/**
 * Redact PDF using ratio-based or absolute coordinates.
 * If any redaction is tagged as source: "text", the output is flattened
 * to permanently remove searchable text content.
 *
 * @param {string} inputPath - Path to uploaded PDF
 * @param {object|Array} optionsOrAreas - Options or direct redaction array
 * @returns {Promise<{path: string}>} - Path to redacted PDF
 */
async function redactPdf(inputPath, optionsOrAreas) {
  const options = Array.isArray(optionsOrAreas)
    ? { redactAreas: optionsOrAreas }
    : (optionsOrAreas || {});

  const {
    redactAreas,
    pageNumbers,
    convertToPdfa,
    pdfaLevel,
  } = options;

  if (!redactAreas || (Array.isArray(redactAreas) && redactAreas.length === 0)) {
    throw new Error('Redactions array is required and must not be empty');
  }

  const buffer = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(buffer);
  const totalPages = doc.getPageCount();
  const pages = doc.getPages();

  let pageIndices = null;
  if (pageNumbers) {
    const parsed = parsePageRanges(pageNumbers, totalPages);
    if (parsed.error) throw new Error(parsed.error);
    pageIndices = parsed.indices;
  }

  const normalizedAreas = normalizeRedactions({
    redactAreas,
    pages,
    totalPages,
    pageIndices,
  });

  if (!normalizedAreas.length) {
    throw new Error('No valid redaction areas found');
  }

  const black = rgb(0, 0, 0);

  normalizedAreas.forEach(area => {
    const page = pages[area.pageIndex];
    if (!page) return;

    const { width, height } = page.getSize();
    const x = Math.max(0, Math.min(area.x, width));
    const y = Math.max(0, Math.min(area.y, height));
    const w = Math.min(area.width, width - x);
    const h = Math.min(area.height, height - y);

    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: black,
    });
  });

  const preFlattenPath = path.join(
    path.dirname(inputPath),
    `redact-pre-${Date.now()}.pdf`
  );
  fs.writeFileSync(preFlattenPath, await doc.save());

  const hasTextRedaction = normalizedAreas.some(a => a.source === 'text');

  let finalPath = preFlattenPath;

  if (hasTextRedaction) {
    const flattenPath = path.join(
      path.dirname(inputPath),
      `redacted-${Date.now()}.pdf`
    );
    try {
      await flattenPdf(preFlattenPath, flattenPath, { dpi: 300 });
      finalPath = flattenPath;
    } finally {
      try { fs.unlinkSync(preFlattenPath); } catch (_) {}
    }
  } else {
    finalPath = preFlattenPath;
  }

  if (convertToPdfa) {
    const result = await pdfaPdfService.convertToPdfa(finalPath, {
      pdfaLevel: pdfaLevel || 'PDF/A-1b',
    });
    try { fs.unlinkSync(finalPath); } catch (_) {}
    finalPath = result.path;
  }

  return { path: finalPath };
}

function normalizeRedactions({ redactAreas, pages, totalPages, pageIndices }) {
  const areas = [];

  if (typeof redactAreas === 'string') {
    const parsed = parseRedactAreas(redactAreas, totalPages);
    if (parsed.error) throw new Error(parsed.error);
    parsed.areas.forEach(a => {
      if (!pageIndices || pageIndices.includes(a.pageIndex)) {
        areas.push({ ...a, source: 'area' });
      }
    });
    return areas;
  }

  if (!Array.isArray(redactAreas)) return [];

  redactAreas.forEach(raw => {
    if (!raw || raw.enabled === false) return;

    const pageIndex =
      Number.isInteger(raw.pageIndex) ? raw.pageIndex :
      Number.isInteger(raw.page) ? raw.page :
      Number.isInteger(raw.pageNumber) ? raw.pageNumber - 1 :
      Number.isInteger(raw.pageNum) ? raw.pageNum - 1 :
      null;

    if (pageIndex === null || pageIndex < 0 || pageIndex >= totalPages) return;
    if (pageIndices && !pageIndices.includes(pageIndex)) return;

    const page = pages[pageIndex];
    if (!page) return;

    const { width, height } = page.getSize();

    let x;
    let y;
    let w;
    let h;

    if (
      typeof raw.xRatio === 'number' &&
      typeof raw.yRatio === 'number' &&
      typeof raw.widthRatio === 'number' &&
      typeof raw.heightRatio === 'number'
    ) {
      x = raw.xRatio * width;
      const rectHeight = raw.heightRatio * height;
      y = height - (raw.yRatio * height) - rectHeight;
      w = raw.widthRatio * width;
      h = rectHeight;
    } else if (
      typeof raw.x === 'number' &&
      typeof raw.y === 'number' &&
      typeof raw.width === 'number' &&
      typeof raw.height === 'number'
    ) {
      x = raw.x;
      y = raw.y;
      w = raw.width;
      h = raw.height;
    } else {
      return;
    }

    if (w <= 0 || h <= 0) return;

    areas.push({
      pageIndex,
      x,
      y,
      width: w,
      height: h,
      source: raw.source || 'area',
    });
  });

  return areas;
}

export { redactPdf };
