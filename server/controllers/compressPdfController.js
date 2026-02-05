import * as compressPdfService from '../services/compressPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/compress
 * Body: pdfFile, compressionLevel (optional: 'low' | 'medium' | 'high')
 */
export async function compressPdf(req, res, next) {
  const uploadedPath = req.file?.path;

  if (!uploadedPath) {
    return res.status(400).json({
      success: false,
      error: 'PDF file is required (pdfFile)',
    });
  }

  // ✅ UPDATED: safer string conversion
  const compressionLevel = String(
    getBodyValue(req.body, 'compressionLevel') ??
      req.body?.compressionLevel ??
      'medium'
  ).toLowerCase();

  if (!['low', 'medium', 'high'].includes(compressionLevel)) {
    return res.status(400).json({
      success: false,
      error: 'compressionLevel must be "low", "medium", or "high"',
    });
  }

  try {
    const result = await compressPdfService.compressPdf(
      uploadedPath,
      compressionLevel
    );

    const filename = path.basename(result.outputPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Original-Size', result.originalSize.toString());
    res.setHeader('X-Compressed-Size', result.compressedSize.toString());

    // ✅ UPDATED: no next(err) after sendFile
    res.sendFile(path.resolve(result.outputPath), (err) => {
      removeFiles([uploadedPath, result.outputPath]);
      if (err) {
        console.error(err);
      }
    });
  } catch (error) {
    removeFiles([uploadedPath]);
    next(error);
  }
}
