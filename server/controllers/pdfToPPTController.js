import archiver from "archiver";
import { convertPdfBufferToPptBuffer } from "../services/pdfToPPTService.js";

async function convertPdfToPpt(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="converted-${Date.now()}.zip"`
  );

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  try {
    for (const file of req.files) {
      const pptBuffer = await convertPdfBufferToPptBuffer(file.buffer);

      const fileName = file.originalname.replace(".pdf", ".pptx");

      archive.append(pptBuffer, { name: fileName });
    }

    await archive.finalize();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed" });
  }
}

export { convertPdfToPpt };