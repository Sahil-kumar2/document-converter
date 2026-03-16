import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

const parseColor = (hex) => {
  if (!hex) return rgb(0, 0, 0);
  const cleaned = hex.replace("#", "");
  if (cleaned.length < 6) return rgb(0, 0, 0);
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
};

const getFont = async (pdfDoc, bold, italic) => {
  if (bold && italic) return pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  if (bold) return pdfDoc.embedFont(StandardFonts.HelveticaBold);
  if (italic) return pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  return pdfDoc.embedFont(StandardFonts.Helvetica);
};

export const editPdf = async (inputPath, elements = []) => {
  if (!fs.existsSync(inputPath)) {
    throw new Error("Input file not found");
  }

  const originalBytes = fs.readFileSync(inputPath);
  const originalPdf = await PDFDocument.load(originalBytes);

  // Create new document with copies of all pages
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(
    originalPdf,
    originalPdf.getPageIndices()
  );
  copiedPages.forEach((page) => newPdf.addPage(page));

  const totalPages = newPdf.getPageCount();

  for (const el of elements) {
    try {
      if (!el?.pageNumber) continue;
      if (el.pageNumber < 1 || el.pageNumber > totalPages) continue;

      const page = newPdf.getPage(el.pageNumber - 1);
      const { width, height } = page.getSize();
      const font = await getFont(newPdf, el.bold, el.italic);

      if (el.type === "replaceText") {
        // --- Inline text replacement ---
        if (
          typeof el.x === "number" &&
          typeof el.y === "number" &&
          typeof el.width === "number" &&
          typeof el.height === "number"
        ) {
          // Position-based replacement (from inline edit)
          // el.x, el.y, el.width, el.height are in unscaled PDF coordinates
          // PDF coordinate system: origin at bottom-left, y increases upward
          const pdfX = el.x;
          const pdfH = el.height;
          // Convert top-left origin y to bottom-left origin y
          const pdfY = height - el.y - pdfH;
          const pdfW = el.width;

          // 1. Whiteout the original text area (with small padding)
          const padding = 2;
          page.drawRectangle({
            x: Math.max(0, pdfX - padding),
            y: Math.max(0, pdfY - padding),
            width: Math.min(pdfW + padding * 2, width - pdfX + padding),
            height: pdfH + padding * 2,
            color: rgb(1, 1, 1), // white
          });

          // 2. Draw the new text at the same position
          if (el.text && el.text.length > 0) {
            const textSize = el.fontSize || Math.round(pdfH * 0.85);
            page.drawText(el.text, {
              x: pdfX,
              y: pdfY + (pdfH - textSize) / 2, // vertically center
              size: textSize,
              font,
              color: parseColor(el.color),
              opacity: el.opacity ?? 1,
            });
          }
        } else if (
          typeof el.xRatio === "number" &&
          typeof el.yRatio === "number"
        ) {
          // Ratio-based placement (from add-text mode)
          const x = el.xRatio * width;
          const y = (1 - el.yRatio) * height;
          const textSize = el.fontSize || 14;

          // If there's a box to whiteout (for overlay replacement)
          if (el.boxWidth > 0 && el.boxHeight > 0) {
            const boxW = (el.boxWidth / 1000) * width;
            const boxH = (el.boxHeight / 1000) * height;
            page.drawRectangle({
              x: x - 2,
              y: y - boxH / 2 - 2,
              width: boxW + 4,
              height: boxH + 4,
              color: rgb(1, 1, 1),
            });
          }

          page.drawText(el.text, {
            x,
            y: y - textSize / 2,
            size: textSize,
            font,
            color: parseColor(el.color),
            opacity: el.opacity ?? 1,
          });
        }
      }
    } catch (err) {
      console.error("[EditPdf] Element error:", err);
    }
  }

  const outputPath = path.join(
    path.dirname(inputPath),
    `edited-${Date.now()}.pdf`
  );

  const editedBytes = await newPdf.save();
  fs.writeFileSync(outputPath, editedBytes);

  console.log(`[EditPdf] Saved edited PDF: ${outputPath}, ${elements.length} edits applied`);

  return outputPath;
};