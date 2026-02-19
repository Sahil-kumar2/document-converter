import { createPdfFromImages } from "../services/createPDFFromImagesService.js";



export const convertImagesToPDF = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const pdfBytes = await createPdfFromImages(req.files);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=converted.pdf"
    );

    return res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};