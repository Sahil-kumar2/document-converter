import * as removePagesService from '../services/removePagesService.js';
import { removeFiles } from '../utils/cleanup.js';
import { getBodyValue } from '../utils/bodyFields.js';
import { parsePageRanges } from '../utils/pageRangeParser.js';
import path from 'path';
import fs from 'fs';

/**
 * POST /api/pdf/remove-pages
 * Body: pdfFile, pageRanges (e.g., "1,3,5-7")
 */
export async function removePages(req, res, next) {
  const uploadedPath = req.file?.path;
  console.log("Uploaded file path:", uploadedPath);

  // ✅ Validate file
  if (!uploadedPath) {
    return res.status(400).json({
      success: false,
      error: 'PDF file is required (pdfFile)',
    });
  }

  const pageRanges =
    getBodyValue(req.body, 'pageRanges') || req.body?.pageRanges;

  // ✅ Validate pageRanges
  if (!pageRanges) {
    removeFiles([uploadedPath]);
    return res.status(400).json({
      success: false,
      error: 'pageRanges is required (e.g., "1,3,5-7")',
    });
  }

  // ✅ Basic format validation
  const validation = parsePageRanges(pageRanges, 9999);
  if (validation.error) {
    removeFiles([uploadedPath]);
    return res.status(400).json({
      success: false,
      error: `Invalid page ranges: ${validation.error}`,
    });
  }

  try {
    console.log("Processing remove pages...");

    const outputPath = await removePagesService.removePages(
      uploadedPath,
      pageRanges
    );

    if (!outputPath) {
      throw new Error("Output file path not returned from service");
    }

    const absolutePath = path.resolve(outputPath);
    console.log("Generated output path:", absolutePath);

    // ✅ Ensure file exists before sending
    if (!fs.existsSync(absolutePath)) {
      throw new Error("Generated PDF file does not exist");
    }

    const filename = path.basename(absolutePath);

    // ✅ Use download (more stable for file sending)
    res.download(absolutePath, filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          next(err);
        }
      }
    });

    // ✅ Cleanup AFTER response finishes
    res.on('finish', () => {
      console.log("Cleaning up files...");
      removeFiles([uploadedPath, absolutePath]);
    });

  } catch (error) {
    console.error("Controller error:", error);

    // Cleanup uploaded file if something fails
    removeFiles([uploadedPath]);

    if (!res.headersSent) {
      next(error);
    }
  }
}
