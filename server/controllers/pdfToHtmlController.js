import { runPdfToHtml } from "../services/pdfToHtmlService.js";

export const convertPdfToHtml = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const html = await runPdfToHtml(req.file.buffer);

    res.setHeader("Content-Type", "text/html");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=converted.html"
    );

    res.send(html);

  } catch (error) {
    console.error("PDF TO HTML ERROR:", error);
    res.status(500).send("Conversion Failed");
  }
};
