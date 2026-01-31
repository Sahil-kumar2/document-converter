import * as cropPdfService from '../services/cropPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/crop
 * Body: pdfFile, pageNumbers (optional), cropBox: x, y, width, height
 */
async function cropPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const x = parseFloat(getBodyValue(req.body, 'cropX') ?? getBodyValue(req.body, 'x') ?? req.body?.cropX ?? req.body?.x);
  const y = parseFloat(getBodyValue(req.body, 'cropY') ?? getBodyValue(req.body, 'y') ?? req.body?.cropY ?? req.body?.y);
  const width = parseFloat(getBodyValue(req.body, 'cropWidth') ?? getBodyValue(req.body, 'width') ?? req.body?.cropWidth ?? req.body?.width);
  const height = parseFloat(getBodyValue(req.body, 'cropHeight') ?? getBodyValue(req.body, 'height') ?? req.body?.cropHeight ?? req.body?.height);

  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(width) || Number.isNaN(height)) {
    return res.status(400).json({
      success: false,
      error: 'cropBox required: x, y, width, height (numeric). Use form fields: cropX, cropY, cropWidth, cropHeight (or x, y, width, height)',
    });
  }

  const pageNumbers = getBodyValue(req.body, 'pageNumbers');

  try {
    const result = await cropPdfService.cropPdf(uploadedPath, {
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
