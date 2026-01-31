const pdfaPdfService = require('../services/pdfaPdfService');
const { removeFiles } = require('../utils/cleanup');
const { ApiError } = require('../utils/errors');
const { getBodyValue } = require('../utils/bodyFields');
const path = require('path');

/**
 * POST /api/pdf/pdfa
 * Body: pdfFile, pdfaLevel (PDF/A-1b | PDF/A-2b | PDF/A-3b, default PDF/A-1b)
 */
async function convertToPdfa(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const pdfaLevelRaw = getBodyValue(req.body, 'pdfaLevel') ?? req.body?.pdfaLevel ?? 'PDF/A-1b';
  const pdfaLevel = String(pdfaLevelRaw).trim();
  if (!pdfaPdfService.SUPPORTED_LEVELS.includes(pdfaLevel)) {
    return res.status(400).json({
      success: false,
      error: `pdfaLevel must be one of: ${pdfaPdfService.SUPPORTED_LEVELS.join(', ')}`,
    });
  }

  try {
    const result = await pdfaPdfService.convertToPdfa(uploadedPath, { pdfaLevel });

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
      error: err.message || 'PDF/A conversion failed',
    });
  }
}

module.exports = { convertToPdfa };
