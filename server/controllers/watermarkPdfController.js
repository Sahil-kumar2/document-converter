import * as watermarkPdfService from '../services/watermarkPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import { ApiError } from '../utils/errors.js';
import { getBodyValue } from '../utils/bodyFields.js';
import path from 'path';

/**
 * POST /api/pdf/watermark
 * Body: pdfFile, watermarkText, position (center|top|bottom), opacity, fontSize, pageNumbers
 */
async function watermarkPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: 'PDF file is required (pdfFile)' });
  }

  const watermarkTypeRaw = getBodyValue(req.body, 'type') ?? req.body?.type ?? 'text';
  const watermarkTypeValue = String(watermarkTypeRaw).toLowerCase().trim() || 'text';
  const watermarkType = watermarkTypeValue === 'image' ? 'image' : 'text';

  const imageFile =
    req.files?.['watermarkImage']?.[0] ??
    req.files?.['watermarkImage ']?.[0];

  const watermarkText = getBodyValue(req.body, 'watermarkText');
  if (watermarkType !== 'image' && !watermarkText) {
    return res.status(400).json({
      success: false,
      error: 'watermarkText is required and must not be empty',
    });
  }

  if (watermarkType === 'image' && !imageFile?.path) {
    return res.status(400).json({
      success: false,
      error: 'watermarkImage is required for image watermark',
    });
  }

  const positionRaw = getBodyValue(req.body, 'position') ?? req.body?.position ?? 'center';
  const position = String(positionRaw).toLowerCase().trim();
  const validPositions = [
    'center',
    'top',
    'bottom',
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  const opacityRaw = getBodyValue(req.body, 'opacity') ?? req.body?.opacity ?? 0.3;
  const opacity = parseFloat(String(opacityRaw));
  if (Number.isNaN(opacity) || opacity < 0 || opacity > 1) {
    return res.status(400).json({
      success: false,
      error: 'opacity must be a number between 0 and 1',
    });
  }

  const fontSizeRaw = getBodyValue(req.body, 'fontSize') ?? req.body?.fontSize ?? 48;
  const fontSize = parseInt(String(fontSizeRaw), 10);
  const pageNumbers = getBodyValue(req.body, 'pageNumbers');

  const xRatioRaw = getBodyValue(req.body, 'xRatio') ?? req.body?.xRatio;
  const yRatioRaw = getBodyValue(req.body, 'yRatio') ?? req.body?.yRatio;
  const xRatio = xRatioRaw !== undefined ? parseFloat(String(xRatioRaw)) : undefined;
  const yRatio = yRatioRaw !== undefined ? parseFloat(String(yRatioRaw)) : undefined;

  if (xRatio !== undefined && (Number.isNaN(xRatio) || xRatio < 0 || xRatio > 1)) {
    return res.status(400).json({
      success: false,
      error: 'xRatio must be a number between 0 and 1',
    });
  }

  if (yRatio !== undefined && (Number.isNaN(yRatio) || yRatio < 0 || yRatio > 1)) {
    return res.status(400).json({
      success: false,
      error: 'yRatio must be a number between 0 and 1',
    });
  }

  if ((xRatio === undefined || yRatio === undefined) && !validPositions.includes(position)) {
    return res.status(400).json({
      success: false,
      error: `position must be one of: ${validPositions.join(', ')}`,
    });
  }

  const scaleRaw = getBodyValue(req.body, 'scale') ?? req.body?.scale ?? 0.3;
  const scale = parseFloat(String(scaleRaw));
  if (Number.isNaN(scale) || scale <= 0 || scale > 1) {
    return res.status(400).json({
      success: false,
      error: 'scale must be a number between 0 and 1',
    });
  }

  const rotationRaw = getBodyValue(req.body, 'rotation') ?? req.body?.rotation ?? 0;
  const rotation = parseFloat(String(rotationRaw));
  if (Number.isNaN(rotation)) {
    return res.status(400).json({
      success: false,
      error: 'rotation must be a valid number',
    });
  }

  const pageScopeRaw = getBodyValue(req.body, 'pageScope') ?? req.body?.pageScope ?? 'all';
  const pageScopeValue = String(pageScopeRaw).toLowerCase().trim() || 'all';
  const pageScope = pageScopeValue === 'current' ? 'current' : 'all';

  const pageNumberRaw = getBodyValue(req.body, 'pageNumber') ?? req.body?.pageNumber ?? '1';
  const pageNumber = parseInt(String(pageNumberRaw), 10);

  const fontFamily = getBodyValue(req.body, 'fontFamily') ?? req.body?.fontFamily ?? 'Helvetica';
  const fontColor = getBodyValue(req.body, 'fontColor') ?? req.body?.fontColor ?? '#666666';
  const boldRaw = getBodyValue(req.body, 'bold') ?? req.body?.bold ?? false;
  const italicRaw = getBodyValue(req.body, 'italic') ?? req.body?.italic ?? false;
  const bold = String(boldRaw).toLowerCase() === 'true' || boldRaw === true;
  const italic = String(italicRaw).toLowerCase() === 'true' || italicRaw === true;

  try {
    const result = await watermarkPdfService.watermarkPdf(uploadedPath, {
      type: watermarkType,
      watermarkText,
      position,
      opacity,
      fontSize: Number.isNaN(fontSize) ? 48 : Math.min(Math.max(fontSize, 8), 200),
      pageNumbers: pageNumbers || undefined,
      xRatio,
      yRatio,
      scale,
      rotation,
      pageScope,
      pageNumber: Number.isNaN(pageNumber) ? 1 : pageNumber,
      imagePath: imageFile?.path,
      fontFamily,
      fontColor,
      bold,
      italic,
    });

    const outPath = result.path;
    const filename = path.basename(outPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(path.resolve(outPath), (err) => {
      removeFiles([uploadedPath, outPath, imageFile?.path]);
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    removeFiles([uploadedPath, imageFile?.path]);
    const status = err instanceof ApiError ? err.statusCode : 400;
    res.status(status).json({
      success: false,
      error: err.message || 'Watermark failed',
    });
  }
}

export { watermarkPdf };
