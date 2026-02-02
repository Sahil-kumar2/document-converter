import * as removePagesService from '../services/removePagesService.js';
import { removeFiles } from '../utils/cleanup.js';
import { getBodyValue } from '../utils/bodyFields.js';
import { parsePageRanges } from '../utils/pageRangeParser.js';
import path from 'path';

/**
 * POST /api/pdf/remove-pages
 * Body: pdfFile, pageRanges (e.g., "1,3,5-7")
 */
export async function removePages(req, res, next) {
  const uploadedPath = req.file?.path;
  
  if (!uploadedPath) {
    return res.status(400).json({
      success: false,
      error: 'PDF file is required (pdfFile)',
    });
  }
  
  const pageRanges = getBodyValue(req.body, 'pageRanges') || req.body?.pageRanges;
  
  if (!pageRanges) {
    return res.status(400).json({
      success: false,
      error: 'pageRanges is required (e.g., "1,3,5-7")',
    });
  }
  
  // Validate page ranges format (basic check)
  const validation = parsePageRanges(pageRanges, 9999); // Use high max for format validation
  if (validation.error) {
    return res.status(400).json({
      success: false,
      error: `Invalid page ranges: ${validation.error}`,
    });
  }
  
  try {
    const outputPath = await removePagesService.removePages(uploadedPath, pageRanges);
    const filename = path.basename(outputPath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.sendFile(path.resolve(outputPath), (err) => {
      removeFiles([uploadedPath, outputPath]);
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    removeFiles([uploadedPath]);
    next(error);
  }
}
