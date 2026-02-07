import * as splitPdfService from '../services/splitPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/split
 * Body: pdfFile, mode ("pages" | "custom" | "fixed"), ranges (JSON array), mergeAll (boolean)
 */
async function splitPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const mode = (getBodyValue(req.body, 'mode') || req.body?.mode || '').toLowerCase();
  if (!['pages', 'custom', 'fixed'].includes(mode)) {
    return res.status(400).json({
      success: false,
      error: 'mode must be "pages", "custom", or "fixed"',
    });
  }

  const rangesStr = getBodyValue(req.body, 'ranges') || req.body?.ranges;
  const mergeAllStr = getBodyValue(req.body, 'mergeAll') || req.body?.mergeAll || 'false';
  const mergeAll = mergeAllStr === 'true' || mergeAllStr === true;

  let ranges = null;
  if (rangesStr) {
    try {
      ranges = JSON.parse(rangesStr);
      if (!Array.isArray(ranges)) {
        return res.status(400).json({
          success: false,
          error: 'ranges must be a JSON array of {from, to} objects',
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ranges JSON format',
      });
    }
  }

  try {
    const result = await splitPdfService.splitPdf(uploadedPath, {
      mode,
      ranges,
      mergeAll,
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
