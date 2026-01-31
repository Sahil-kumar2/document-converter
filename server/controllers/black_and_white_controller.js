import { convertToBlackWhite } from "../services/black_and_white_services.js";

export async function blackWhiteController(req, res) {
  try {
    const originalPath = req.file.path;

    const processedPath = await convertToBlackWhite(originalPath);

    res.json({
      success: true,
      message: "Image converted to black & white",
      processedImage: processedPath
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
