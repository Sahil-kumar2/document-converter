import * as rotatePdfService from '../services/rotatePdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/rotate
 * Body: pdfFile, pageRotations (JSON map) OR rotationAngle + pageNumbers (legacy)
 */
async function rotatePdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const pageRotationsStr = getBodyValue(req.body, 'pageRotations');
  const rotationAngleRaw = getBodyValue(req.body, 'rotationAngle') ?? req.body?.rotationAngle;
  const pageNumbers = getBodyValue(req.body, 'pageNumbers');

  let pageRotations = null;

  // New format: pageRotations map
  if (pageRotationsStr) {
    try {
      pageRotations = JSON.parse(pageRotationsStr);
      if (typeof pageRotations !== 'object' || Array.isArray(pageRotations)) {
        return res.status(400).json({
          success: false,
          error: 'pageRotations must be a JSON object',
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pageRotations JSON format',
      });
    }
  }
  // Legacy format: single rotationAngle
  else if (rotationAngleRaw) {
    const rotationAngle = parseInt(rotationAngleRaw, 10);
    if (![90, 180, 270].includes(rotationAngle)) {
      return res.status(400).json({
        success: false,
        error: 'rotationAngle must be 90, 180, or 270',
      });
    }
    pageRotations = { rotationAngle, pageNumbers };
  } else {
    return res.status(400).json({
      success: false,
      error: 'Either pageRotations or rotationAngle must be provided',
    });
  }

  try {
    const result = await rotatePdfService.rotatePdf(uploadedPath, pageRotations);

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
