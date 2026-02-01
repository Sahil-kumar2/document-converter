import * as extractPdfService from '../services/extractPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/extract
 * Body: pdfFile, pageNumbers (e.g. "2,4,6-8")
 */
async function extractPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const pageNumbers = getBodyValue(req.body, 'pageNumbers');
  if (!pageNumbers) {
    return res.status(400).json({
      success: false,
      error: 'pageNumbers is required (e.g. "2,4,6-8")',
    });
  }

  try {
    const result = await extractPdfService.extractPdf(uploadedPath, {
      pageNumbers,
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
      error: err.message || 'Extract failed',
    });
  }
}

export { extractPdf };
