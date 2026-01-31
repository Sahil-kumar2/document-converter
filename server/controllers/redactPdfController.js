const redactPdfService = require('../services/redactPdfService');
const { removeFiles } = require('../utils/cleanup');
const { ApiError } = require('../utils/errors');
const { getBodyValue } = require('../utils/bodyFields');
const path = require('path');

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
  const redactAreas = getBodyValue(req.body, 'redactAreas');

  const hasText = redactText && redactText.trim().length > 0;
  const hasAreas = redactAreas && redactAreas.trim().length > 0;

  if (!hasText && !hasAreas) {
    return res.status(400).json({
      success: false,
      error: 'At least one of redactText or redactAreas must be provided',
    });
  }

  const pageNumbers = getBodyValue(req.body, 'pageNumbers');
  const convertToPdfaRaw = getBodyValue(req.body, 'convertToPdfa');
  const convertToPdfa = convertToPdfaRaw === 'true' || convertToPdfaRaw === '1' || req.body?.convertToPdfa === true;
  const pdfaLevel = getBodyValue(req.body, 'pdfaLevel') || req.body?.pdfaLevel;

  try {
    const result = await redactPdfService.redactPdf(uploadedPath, {
      redactText: hasText ? redactText : undefined,
      redactAreas: hasAreas ? redactAreas : undefined,
      pageNumbers: pageNumbers || undefined,
      convertToPdfa: convertToPdfa || undefined,
      pdfaLevel: convertToPdfa ? (pdfaLevel || 'PDF/A-1b') : undefined,
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
      error: err.message || 'Redact failed',
    });
  }
}

module.exports = { redactPdf };
