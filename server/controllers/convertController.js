const path = require("path");
const { runConversion } = require("../services/libreOfficeService");
const { deleteFile } = require("../utils/fileUtils");

exports.convertFile = async (req, res, next) => {
  console.log("REQUEST RECEIVED");
  console.log("Body:", req.body);
  console.log("File:", req.file);

  try {
    if (!req.file) {
      console.log("No file received by server");
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.body.targetFormat) {
      console.log("No target format provided");
      return res.status(400).json({ error: "No target format provided" });
    }

    const inputPath = path.resolve(req.file.path);
    const outputDir = path.resolve("outputs");
    const format = req.body.targetFormat.toLowerCase();
    const ext = path.extname(req.file.originalname).toLowerCase();

    console.log("Input Path:", inputPath);
    console.log("Output Directory:", outputDir);
    console.log("Converting to format:", format);

    const allowedTypes = [".pdf", ".docx", ".xlsx", ".ppt", ".pptx"];
    if (!allowedTypes.includes(ext)) {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    const invalidCombo =
      (ext === ".docx" && format === "xlsx") ||
      (ext === ".xlsx" && format === "docx") ||
      (ext === ".pptx" && format === "xlsx");

    if (invalidCombo) {
      return res.status(400).json({
        error: "This conversion type is not supported",
      });
    }

    const outputFile = await runConversion(inputPath, outputDir, format);

    console.log("Conversion completed");
    console.log("Output File:", outputFile);

    res.download(outputFile, (err) => {
      if (err) {
        console.error("Download error:", err);
      } else {
        console.log("File sent successfully");
      }

      setTimeout(async () => {
        await deleteFile(inputPath);
        await deleteFile(outputFile);
        console.log("Temporary files deleted (delayed)");
      }, 5000);
    });

  } catch (err) {
    console.error("ERROR during conversion:", err);
    next(err);
  }
};
