import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

/**
 * Redact PDF using ratio-based coordinates
 * 
 * @param {string} inputPath - Path to uploaded PDF
 * @param {Array} redactions - Array of redaction objects with ratio coordinates
 *   [
 *     {
 *       pageIndex: 0,
 *       xRatio: 0.12,
 *       yRatio: 0.34,
 *       widthRatio: 0.40,
 *       heightRatio: 0.08
 *     }
 *   ]
 * @returns {Promise<{path: string}>} - Path to redacted PDF
 */
async function redactPdf(inputPath, redactions) {
  if (!redactions || !Array.isArray(redactions) || redactions.length === 0) {
    throw new Error('Redactions array is required and must not be empty');
  }

  // Load the PDF
  const buffer = fs.readFileSync(inputPath);
  const doc = await PDFDocument.load(buffer);
  const totalPages = doc.getPageCount();

  // Group redactions by page
  const redactionsByPage = {};
  redactions.forEach(redaction => {
    const { pageIndex } = redaction;
    if (!redactionsByPage[pageIndex]) {
      redactionsByPage[pageIndex] = [];
    }
    redactionsByPage[pageIndex].push(redaction);
  });

  // Apply redactions to each page
  const pages = doc.getPages();
  const black = rgb(0, 0, 0);

  Object.entries(redactionsByPage).forEach(([pageIndexStr, pageRedactions]) => {
    const pageIndex = parseInt(pageIndexStr, 10);
    
    if (pageIndex < 0 || pageIndex >= totalPages) {
      console.warn(`Skipping redaction on page ${pageIndex}: out of range`);
      return;
    }

    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    pageRedactions.forEach(redaction => {
      const {
        xRatio = 0,
        yRatio = 0,
        widthRatio = 0,
        heightRatio = 0
      } = redaction;

      // Convert ratios to PDF coordinates
      // PDF origin is bottom-left, so y needs inversion
      const x = xRatio * width;
      const rectHeight = heightRatio * height;
      const y = height - (yRatio * height) - rectHeight;
      const w = widthRatio * width;
      const h = rectHeight;

      // Ensure values are within bounds
      const finalX = Math.max(0, Math.min(x, width));
      const finalY = Math.max(0, Math.min(y, height));
      const finalWidth = Math.min(w, width - finalX);
      const finalHeight = Math.min(h, height - finalY);

      // Draw solid black rectangle
      page.drawRectangle({
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight,
        color: black,
      });
    });
  });

  // Save redacted PDF
  const pdfBytes = await doc.save();
  const outputPath = path.join(
    path.dirname(inputPath),
    `redacted-${Date.now()}.pdf`
  );
  
  fs.writeFileSync(outputPath, pdfBytes);
  return { path: outputPath };
}

export { redactPdf };
