import { imagesToPdfService } from "../services/scanToPDFService.js";

export const imagesToPdfController = async (req, res) => {
  try {

    console.log("backend file")
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    const pdfBytes = await imagesToPdfService(req.files);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=scanned.pdf"
    );

    res.send(pdfBytes);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate PDF",
    });
  }
};