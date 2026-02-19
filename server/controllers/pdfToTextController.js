import { runPdfToTextOCR } from "../services/pdfToTextService.js";

export const convertPdfToText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const text = await runPdfToTextOCR(req.file.buffer);

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=converted.txt"
    );

    res.send(text);

  } catch (error) {
    console.error("PDF OCR ERROR:", error);
    res.status(500).send("OCR Failed");
  }
};
