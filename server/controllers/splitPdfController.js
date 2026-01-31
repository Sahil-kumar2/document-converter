import * as splitPdfService from '../services/splitPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/split
 * Body: pdfFile, splitType ("each" | "range"), pageRanges (required for range)
 */
async function splitPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const splitType = (getBodyValue(req.body, 'splitType') || req.body?.splitType || '').toLowerCase();
  if (!['each', 'range'].includes(splitType)) {
    return res.status(400).json({
      success: false,
      error: 'splitType must be "each" or "range"',
    });
  }

  const pageRanges = getBodyValue(req.body, 'pageRanges');
  if (splitType === 'range' && !pageRanges) {
    return res.status(400).json({
      success: false,
      error: 'For splitType "range", pageRanges is required (e.g. 1-3,5-7). Add a form field named "pageRanges".',
    });
  }

  try {
    const result = await splitPdfService.splitPdf(uploadedPath, {
      splitType,
      pageRanges: pageRanges || undefined,
    });

    const outPath = result.path;
    const filename = path.basename(outPath);

    if (result.type === 'zip') {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(path.resolve(outPath), (err) => {
        removeFiles([uploadedPath, outPath]);
        if (err && !res.headersSent) next(err);
      });
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.sendFile(path.resolve(outPath), (err) => {
        removeFiles([uploadedPath, outPath]);
        if (err && !res.headersSent) next(err);
      });
    }
  } catch (err) {
    removeFiles([uploadedPath]);
    const status = err instanceof ApiError ? err.statusCode : 400;
    res.status(status).json({
      success: false,
      error: err.message || 'Split failed',
    });
  }
}

export { splitPdf };
