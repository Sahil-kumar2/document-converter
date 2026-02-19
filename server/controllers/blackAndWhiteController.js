import { convertToBlackWhiteZip } from "../services/blackAndWhiteServices.js";

export async function blackWhiteController(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // 🔥 Dynamic filename (timestamp based)
    const zipName = `black-white-${Date.now()}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipName}"`
    );

    await convertToBlackWhiteZip(req.files, res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
