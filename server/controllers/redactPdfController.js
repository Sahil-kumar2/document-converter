import * as redactPdfService from '../services/redactPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/redact
 * Body: pdfFile, redactText and/or redactAreas (at least one), pageNumbers optional
 */
async function redactPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const redactText = getBodyValue(req.body, 'redactText');
  const redactAreasStr = getBodyValue(req.body, 'redactAreas');

  const hasText = redactText && redactText.trim().length > 0;
  const hasAreas = redactAreasStr && redactAreasStr.trim().length > 0;

  if (!hasText && !hasAreas) {
    return res.status(400).json({
      success: false,
      error: 'At least one of redactText or redactAreas must be provided',
    });
  }

  // Parse JSON redactAreas string into array
  let redactAreas = null;
  if (hasAreas) {
    try {
      redactAreas = JSON.parse(redactAreasStr);
      if (!Array.isArray(redactAreas)) {
        return res.status(400).json({
          success: false,
          error: 'redactAreas must be a JSON array',
        });
      }
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error: 'Invalid redactAreas JSON format',
      });
    }
  }

  const pageNumbers = getBodyValue(req.body, 'pageNumbers');
  const convertToPdfaRaw = getBodyValue(req.body, 'convertToPdfa');
  const convertToPdfa = convertToPdfaRaw === 'true' || convertToPdfaRaw === '1' || req.body?.convertToPdfa === true;
  const pdfaLevel = getBodyValue(req.body, 'pdfaLevel') || req.body?.pdfaLevel;

  try {
    // Pass redactAreas array directly to service
    const result = await redactPdfService.redactPdf(uploadedPath, redactAreas);

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
      error: err.message || 'Redact failed',
    });
  }
}

export { redactPdf };
