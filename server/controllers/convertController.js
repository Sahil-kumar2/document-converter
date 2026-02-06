import path from "path";
import { runConversion } from "../services/libreOfficeService.js";
import { deleteFile } from "../middleware/multerconfig.js";

export const convertFile = async (req, res, next) => {
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

    const conversionRules = {
      ".pdf": ["docx", "xlsx", "png", "jpg", "html", "pptx", "ppt"],
      ".docx": ["pdf"],
      ".xlsx": ["pdf"],
      ".ppt": ["pdf"],
      ".pptx": ["pdf"],
      ".jpg": ["png", "pdf"],
      ".jpeg": ["png", "pdf"],
      ".png": ["jpg", "pdf"],
      ".webp": ["jpg", "png", "pdf"],
      ".html": ["pdf"]
    };
    if (!conversionRules[ext] || !conversionRules[ext].includes(format)) {
      return res.status(400).json({
        error: `Conversion from ${ext} to ${format} is not supported`
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
