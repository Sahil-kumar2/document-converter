import * as watermarkPdfService from '../services/watermarkPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/watermark
 * Body: pdfFile, watermarkText, position (center|top|bottom), opacity, fontSize, pageNumbers
 */
async function watermarkPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const watermarkText = getBodyValue(req.body, 'watermarkText');
  if (!watermarkText) {
    return res.status(400).json({
      success: false,
      error: 'watermarkText is required and must not be empty',
    });
  }

  const positionRaw = getBodyValue(req.body, 'position') ?? req.body?.position ?? 'center';
  const position = String(positionRaw).toLowerCase().trim();
  const validPositions = ['center', 'top', 'bottom'];
  if (!validPositions.includes(position)) {
    return res.status(400).json({
      success: false,
      error: `position must be one of: ${validPositions.join(', ')}`,
    });
  }

  const opacityRaw = getBodyValue(req.body, 'opacity') ?? req.body?.opacity ?? 0.3;
  const opacity = parseFloat(String(opacityRaw));
  if (Number.isNaN(opacity) || opacity < 0 || opacity > 1) {
    return res.status(400).json({
      success: false,
      error: 'opacity must be a number between 0 and 1',
    });
  }

  const fontSizeRaw = getBodyValue(req.body, 'fontSize') ?? req.body?.fontSize ?? 48;
  const fontSize = parseInt(String(fontSizeRaw), 10);
  const pageNumbers = getBodyValue(req.body, 'pageNumbers');

  try {
    const result = await watermarkPdfService.watermarkPdf(uploadedPath, {
      watermarkText,
      position,
      opacity,
      fontSize: Number.isNaN(fontSize) ? 48 : Math.min(Math.max(fontSize, 8), 200),
      pageNumbers: pageNumbers || undefined,
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
      error: err.message || 'Watermark failed',
    });
  }
}

export { watermarkPdf };
