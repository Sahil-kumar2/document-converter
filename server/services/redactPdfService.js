const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { parsePageRanges } = require('../utils/pageRangeParser');
const { parseRedactAreas } = require('../utils/redactAreasParser');
const { flattenPdf } = require('../utils/ghostscript');
const pdfaPdfService = require('./pdfaPdfService');

/**
 * Find bounding boxes for all occurrences of searchText using pdfjs-dist
 * Returns PDF coordinates (origin bottom-left)
 */
async function findTextAreas(pdfBuffer, searchText, pageIndices) {
  let pdfjsLib;
  const originalWarn = console.warn;

  // Silence irrelevant Node warnings
  console.warn = (...args) => {
    const msg = args[0] && String(args[0]);
    if (
      msg &&
      (msg.includes('DOMMatrix') ||
        msg.includes('Path2D') ||
        msg.includes("Cannot find module 'canvas'"))
    ) return;
    originalWarn.apply(console, args);
  };

  try {
    pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
  } catch {
    console.warn = originalWarn;
    throw new Error(
      'Text search requires pdfjs-dist. Install it with: npm install pdfjs-dist'
    );
  }

  // Find the correct path to standard_fonts inside pdfjs-dist
  let standardFontPath;
  try {
    // Try to resolve from pdfjs-dist package
    const pdfjsDistDir = path.dirname(require.resolve('pdfjs-dist/package.json'));
    standardFontPath = path.join(pdfjsDistDir, 'standard_fonts/');
  } catch {
    // Fallback: try node_modules relative to this file
    standardFontPath = path.join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/');
  }

  // Always pass Uint8Array
  const data = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  let doc;
  try {
    doc = await pdfjsLib.getDocument({
      data,
      standardFontDataUrl: standardFontPath,
    }).promise;
  } finally {
    console.warn = originalWarn;
  }

  const boxes = [];
  const numPages = doc.numPages;

  for (let i = 0; i < numPages; i++) {
    if (pageIndices && !pageIndices.includes(i)) continue;

    const page = await doc.getPage(i + 1);
    const content = await page.getTextContent();
    const items = content.items || [];
    const fullText = items.map(it => it.str).join('');

    let idx = 0;
    while ((idx = fullText.indexOf(searchText, idx)) !== -1) {
      const end = idx + searchText.length;
      let charOffset = 0;

      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      for (const item of items) {
        const len = item.str.length;
        const start = charOffset;
        charOffset += len;

        if (charOffset <= idx || start >= end) continue;

        const [a, b, c, d, x, y] = item.transform;
        const w = item.width * a;
        const h = item.height * d;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }

      if (minX !== Infinity) {
        boxes.push({
          pageIndex: i,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        });
      }

      idx++;
    }
  }

  return boxes;
}

/**
 * Main redaction pipeline:
 * pdf-lib overlay → Ghostscript raster flatten → optional PDF/A
 */
async function redactPdf(inputPath, options) {
  const {
    redactText,
    redactAreas,
    pageNumbers,
    convertToPdfa,
    pdfaLevel,
  } = options;

  if (!redactText && !redactAreas) {
    throw new Error('Provide redactText or redactAreas');
  }

  const buffer = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(buffer);
  const totalPages = doc.getPageCount();

  let pageIndices = null;
  if (pageNumbers) {
    const parsed = parsePageRanges(pageNumbers, totalPages);
    if (parsed.error) throw new Error(parsed.error);
    pageIndices = parsed.indices;
  }

  const allAreas = [];

  if (redactAreas) {
    const parsed = parseRedactAreas(redactAreas, totalPages);
    if (parsed.error) throw new Error(parsed.error);
    parsed.areas.forEach(a => {
      if (!pageIndices || pageIndices.includes(a.pageIndex)) {
        allAreas.push(a);
      }
    });
  }

  if (redactText) {
    const textAreas = await findTextAreas(
      buffer,
      redactText.trim(),
      pageIndices
    );
    allAreas.push(...textAreas);
  }

  const pages = doc.getPages();
  const black = rgb(0, 0, 0);

  for (const area of allAreas) {
    const page = pages[area.pageIndex];
    if (!page) continue;

    const { width, height } = page.getSize();
    const x = Math.max(0, Math.min(area.x, width));
    const y = Math.max(0, Math.min(area.y, height));

    page.drawRectangle({
      x,
      y,
      width: Math.min(area.width, width - x),
      height: Math.min(area.height, height - y),
      color: black,
      opacity: 1,
    });
  }

  const preFlattenPath = path.join(
    path.dirname(inputPath),
    `redact-pre-${Date.now()}.pdf`
  );
  fs.writeFileSync(preFlattenPath, await doc.save());

  const flattenPath = path.join(
    path.dirname(inputPath),
    `redact-${Date.now()}.pdf`
  );

  try {
    await flattenPdf(preFlattenPath, flattenPath, { dpi: 300 });
  } finally {
    try { fs.unlinkSync(preFlattenPath); } catch {}
  }

  let finalPath = flattenPath;

  if (convertToPdfa) {
    const result = await pdfaPdfService.convertToPdfa(flattenPath, {
      pdfaLevel: pdfaLevel || 'PDF/A-1b',
    });
    try { fs.unlinkSync(flattenPath); } catch {}
    finalPath = result.path;
  }

  return { path: finalPath };
}

/**
 * Redact by areas only
 */
async function redactPdfByAreas(inputPath, areas, options = {}) {
  const areasStr =
    typeof areas === 'string'
      ? areas
      : areas
          .map(
            a =>
              `${(a.pageIndex ?? a.page) + 1}:${a.x},${a.y},${a.width},${a.height}`
          )
          .join(';');

  return redactPdf(inputPath, {
    redactAreas: areasStr,
    convertToPdfa: options.convertToPdfa,
    pdfaLevel: options.pdfaLevel,
  });
}

module.exports = {
  redactPdf,
  redactPdfByAreas,
};
