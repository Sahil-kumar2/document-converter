import * as rotatePdfService from '../services/rotatePdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/rotate
 * Body: pdfFile, rotationAngle (90|180|270), pageNumbers (optional)
 */
async function rotatePdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const rotationAngle = parseInt(getBodyValue(req.body, 'rotationAngle') ?? req.body?.rotationAngle, 10);
  if (![90, 180, 270].includes(rotationAngle)) {
    return res.status(400).json({
      success: false,
      error: 'rotationAngle must be 90, 180, or 270',
    });
  }

  const pageNumbers = getBodyValue(req.body, 'pageNumbers');

  try {
    const result = await rotatePdfService.rotatePdf(uploadedPath, {
      rotationAngle,
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
      error: err.message || 'Rotate failed',
    });
  }
}

export { rotatePdf };
