import * as repairPdfService from '../services/repairPdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import path from 'path';

/**
 * POST /api/pdf/repair
 * Body: pdfFile
 */
export async function repairPdf(req, res, next) {
  const uploadedPath = req.file?.path;
  
  if (!uploadedPath) {
    return res.status(400).json({
      success: false,
      error: 'PDF file is required (pdfFile)',
    });
  }
  
  try {
    const repairedPath = await repairPdfService.repairPdf(uploadedPath);
    const filename = path.basename(repairedPath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.sendFile(path.resolve(repairedPath), (err) => {
      removeFiles([uploadedPath, repairedPath]);
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    removeFiles([uploadedPath]);
    
    // Return user-friendly error for unrecoverable PDFs
    if (error.message.includes('too corrupted')) {
      return res.status(422).json({
        success: false,
        error: 'This PDF is too corrupted to repair. The file may be severely damaged.',
      });
    }
    
    next(error);
  }
}
