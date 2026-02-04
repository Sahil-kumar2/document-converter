import * as mergePdfService from '../services/mergePdfService.js';
import { removeFiles } from '../utils/cleanup.js';
import path from 'path';

/**
 * POST /api/pdf/merge
 * Body: Multiple PDF files (field name: pdfFiles)
 */
export async function mergePdfs(req, res, next) {
  const uploadedFiles = req.files;

  if (!uploadedFiles || uploadedFiles.length < 2) {
    return res.status(400).json({
      success: false,
      error: 'At least 2 PDF files are required for merging (field name: pdfFiles)',
    });
  }

  const uploadedPaths = uploadedFiles.map(f => path.resolve(f.path));

  // ✅ Validate mimetype 
  for (const file of uploadedFiles) {
    if (file.mimetype !== 'application/pdf') {
      removeFiles(uploadedPaths);
      return res.status(400).json({
        success: false,
        error: 'Only PDF files are allowed',
      });
    }
  }

  try {
    const mergedPath = await mergePdfService.mergePdfs(uploadedPaths);
    const filename = path.basename(mergedPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.sendFile(path.resolve(mergedPath), err => {
      removeFiles([...uploadedPaths, mergedPath]);
      if (err && !res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    removeFiles(uploadedPaths);
    next(error);
  }
}
