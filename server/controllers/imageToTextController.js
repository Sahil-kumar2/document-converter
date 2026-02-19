import { runOCR } from "../services/imageToTextService.js";

export const imageToText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const result = await runOCR(req.file.buffer);

    const text = result.text || "";

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ocr-result.txt"
    );

    res.send(text);

  } catch (error) {
    console.error("OCR ERROR:", error);
    res.status(500).send("OCR Failed");
  }
};
