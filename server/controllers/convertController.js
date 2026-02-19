import path from "path";
import fs from "fs";
import archiver from "archiver";
import { runConversion } from "../services/libreOfficeService.js";
import { deleteFile } from "../middleware/multerconfig.js";

export const convertFile = async (req, res, next) => {
  try {
     
     console.log("data yaha hai", req.body, req.files)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    if (!req.body.targetFormat) {
      return res.status(400).json({ error: "No target format provided" });
    }

    const outputDir = path.resolve("outputs");
    const format = req.body.targetFormat.toLowerCase();

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

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

    const convertedFiles = [];
   
     
    for (const file of req.files) {
      const inputPath = path.resolve(file.path);
    
      const ext = path.extname(file.originalname).toLowerCase();


      if (!conversionRules[ext] || !conversionRules[ext].includes(format)) {
        await deleteFile(inputPath);
        return res.status(400).json({
          error: `Conversion from ${ext} to ${format} is not supported`
        });
      }
     
      console.log("🚀 Starting conversion...");
      const outputFile = await runConversion(inputPath, outputDir, format);
      console.log("✅ Conversion done:", outputFile);
      convertedFiles.push(outputFile);

      await deleteFile(inputPath);
    }

    // ===============================
    // SINGLE FILE
    // ===============================
    if (convertedFiles.length === 1) {
      return res.download(convertedFiles[0], async () => {
        await deleteFile(convertedFiles[0]);
      });
    }

    // ===============================
    // MULTIPLE FILES → CREATE ZIP
    // ===============================
    const zipName = `converted-${Date.now()}.zip`;
    const zipPath = path.join(outputDir, zipName);  
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
      res.download(zipPath, async () => {
        await deleteFile(zipPath); 
        for (const file of convertedFiles) {
          await deleteFile(file);
        }
      });
    });

    archive.on("error", err => {
      throw err;
    });

    archive.pipe(output);

    convertedFiles.forEach(file => {
      archive.file(file, { name: path.basename(file) });
    });

    archive.finalize();

  } catch (err) {
    console.error("ERROR during conversion:", err);
    next(err);
  }
};
