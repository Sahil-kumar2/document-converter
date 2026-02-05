import * as cropPdfService from '../services/cropPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/crop
 * Body: pdfFile, mode ("current_page" | "all_pages"), pageNumber (for current_page),
 * cropBox: x, y, width, height
 */
async function cropPdf(req, res, next) {
  // ✅ UPDATED: resolve absolute path
  if (!req.file?.path) {
    return res.status(400).json({
      success: false,
      error: 'PDF file is required (pdfFile)',
    });
  }

  const uploadedPath = path.resolve(req.file.path);

  const x = parseFloat(
    getBodyValue(req.body, 'cropX') ??
      getBodyValue(req.body, 'x') ??
      req.body?.cropX ??
      req.body?.x
  );

  const y = parseFloat(
    getBodyValue(req.body, 'cropY') ??
      getBodyValue(req.body, 'y') ??
      req.body?.cropY ??
      req.body?.y
  );

  const width = parseFloat(
    getBodyValue(req.body, 'cropWidth') ??
      getBodyValue(req.body, 'width') ??
      req.body?.cropWidth ??
      req.body?.width
  );

  const height = parseFloat(
    getBodyValue(req.body, 'cropHeight') ??
      getBodyValue(req.body, 'height') ??
      req.body?.cropHeight ??
      req.body?.height
  );

  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(width) || Number.isNaN(height)) {
    return res.status(400).json({
      success: false,
      error:
        'cropBox required: x, y, width, height (numeric). Use form fields: cropX, cropY, cropWidth, cropHeight (or x, y, width, height)',
    });
  }

  // ✅ ADDED: width / height validation
  if (width <= 0 || height <= 0) {
    return res.status(400).json({
      success: false,
      error: 'cropWidth and cropHeight must be greater than 0',
    });
  }

  // Support both old (pageNumbers) and new (mode + pageNumber) formats
  const mode = (getBodyValue(req.body, 'mode') ?? req.body?.mode ?? '').toLowerCase();
  const pageNumber = parseInt(
    getBodyValue(req.body, 'pageNumber') ?? req.body?.pageNumber ?? '1',
    10
  );

  // ✅ UPDATED: normalize pageNumbers
  let pageNumbers = getBodyValue(req.body, 'pageNumbers');
  if (typeof pageNumbers === 'string') {
    pageNumbers = pageNumbers
      .split(',')
      .map(n => parseInt(n.trim(), 10))
      .filter(n => Number.isInteger(n) && n > 0);
  }

  try {
    const result = await cropPdfService.cropPdf(uploadedPath, {
      mode: mode || undefined,
      pageNumber: pageNumber || undefined,
      pageNumbers: pageNumbers || undefined,
      cropBox: { x, y, width, height },
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
      error: err.message || 'Crop failed',
    });
  }
}

export { cropPdf };
