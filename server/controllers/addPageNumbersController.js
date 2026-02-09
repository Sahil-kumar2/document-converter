import * as addPageNumbersService from '../services/addPageNumbersService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/add-page-numbers
 * Body: pdfFile, position, margin, startPage, endPage, textContent, fontFamily, fontSize, bold, italic, underline, textColor, pageMode
 */
async function addPageNumbers(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  // Parse options from request body
  const position = getBodyValue(req.body, 'position') || 'bottom-right';
  const margin = getBodyValue(req.body, 'margin') || 'medium';
  const startPageRaw = getBodyValue(req.body, 'startPage') || '1';
  const endPageRaw = getBodyValue(req.body, 'endPage') || '1000';
  const textContent = getBodyValue(req.body, 'textContent') || '{page}';
  const fontFamily = getBodyValue(req.body, 'fontFamily') || 'Helvetica';
  const fontSizeRaw = getBodyValue(req.body, 'fontSize') || '12';
  const boldRaw = getBodyValue(req.body, 'bold');
  const italicRaw = getBodyValue(req.body, 'italic');
  const underlineRaw = getBodyValue(req.body, 'underline');
  const textColor = getBodyValue(req.body, 'textColor') || '#000000';
  const pageMode = getBodyValue(req.body, 'pageMode') || 'single';

  // Validate and parse numbers
  const startPage = parseInt(startPageRaw, 10);
  const endPage = parseInt(endPageRaw, 10);
  const fontSize = parseInt(fontSizeRaw, 10);

  if (isNaN(startPage) || isNaN(endPage) || isNaN(fontSize)) {
    return res.status(400).json({
      success: false,
      error: 'startPage, endPage, and fontSize must be valid numbers',
    });
  }

  if (fontSize < 1 || fontSize > 200) {
    return res.status(400).json({
      success: false,
      error: 'fontSize must be between 1 and 200',
    });
  }

  // Validate position format
  const validPositions = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];

  if (!validPositions.includes(position)) {
    return res.status(400).json({
      success: false,
      error: `Invalid position. Must be one of: ${validPositions.join(', ')}`,
    });
  }

  // Validate margin
  const validMargins = ['recommended', 'small', 'medium', 'large'];
  if (!validMargins.includes(margin)) {
    return res.status(400).json({
      success: false,
      error: `Invalid margin. Must be one of: ${validMargins.join(', ')}`,
    });
  }

  // Convert boolean strings
  const bold = boldRaw === 'true' || boldRaw === '1';
  const italic = italicRaw === 'true' || italicRaw === '1';
  const underline = underlineRaw === 'true' || underlineRaw === '1';

  try {
    const result = await addPageNumbersService.addPageNumbers(uploadedPath, {
      position,
      margin,
      startPage,
      endPage,
      textContent,
      fontFamily,
      fontSize,
      bold,
      italic,
      underline,
      textColor,
      pageMode,
    });

    const outPath = result.path;
    const filename = path.basename(outPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(outPath), (err) => {
      removeFiles([uploadedPath, outPath]);
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    removeFiles([uploadedPath]);
    const status = err instanceof ApiError ? err.statusCode : 400;
    res.status(status).json({
      success: false,
      error: err.message || 'Add page numbers failed',
    });
  }
}

export { addPageNumbers };
