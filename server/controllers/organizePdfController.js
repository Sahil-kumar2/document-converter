import path from "path";
import { getBodyValue } from "../utils/bodyFields.js";
import { removeFiles } from "../utils/cleanup.js";
import { organizePdf } from "../services/organizePdfService.js";

/**
 * POST /api/pdf/organize
 * Body: pdfFile, pageOrder (JSON array) OR pagesToRemove (e.g. 1,3,5-7)
 */
export async function organizePdfController(req, res, next) {
  const uploadedPath = req.file?.path;
  if (!uploadedPath) {
    return res.status(400).json({ success: false, error: "PDF file is required (pdfFile)" });
  }

  const pageOrderRaw = getBodyValue(req.body, "pageOrder");
  const pagesToRemove = getBodyValue(req.body, "pagesToRemove");
  let pageOrder = undefined;

  if (pageOrderRaw) {
    try {
      const parsed = JSON.parse(pageOrderRaw);
      if (!Array.isArray(parsed)) {
        return res.status(400).json({ success: false, error: "pageOrder must be a JSON array" });
      }
      pageOrder = parsed.map((n) => Number(n));
    } catch (err) {
      return res.status(400).json({ success: false, error: "pageOrder must be valid JSON" });
    }
  }

  if (!pageOrder && !pagesToRemove) {
    return res.status(400).json({
      success: false,
      error: "Provide pageOrder or pagesToRemove",
    });
  }

  try {
    const outputPath = await organizePdf(uploadedPath, {
      pageOrder,
      pagesToRemove,
    });

    const filename = path.basename(outputPath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    res.sendFile(path.resolve(outputPath), (err) => {
      removeFiles([uploadedPath, outputPath]);
      if (err && !res.headersSent) next(err);
    });
  } catch (error) {
    removeFiles([uploadedPath]);
    next(error);
  }
}
