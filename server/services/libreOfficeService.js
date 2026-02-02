  import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const PYTHON_PATH = "C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python314\\python.exe";
const MAGICK_PATH = "C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe";

// recreate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPTS_DIR = path.join(__dirname, "../../python");

export const runConversion = (inputPath, outputDir, format) => {
  return new Promise((resolve, reject) => {
    const safeFormat = format.trim().toLowerCase();
    const inputExt = path.extname(inputPath).toLowerCase();

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // CASE 1: PDF → DOCX
    if (inputExt === ".pdf" && safeFormat === "docx") {
      const outputFile = path.join(outputDir, path.parse(inputPath).name + ".docx");
      const scriptPath = path.join(PYTHON_SCRIPTS_DIR, "pdfToDocx.py");

      const pyCommand = `"${PYTHON_PATH}" "${scriptPath}" "${inputPath}" "${outputFile}"`;
      console.log("🐍 Running Python PDF→Word:", pyCommand);

      exec(pyCommand, (err, stdout, stderr) => {
        console.log("📤 Python stdout:", stdout);
        console.log("⚠️ Python stderr:", stderr);
        if (err) return reject(err);
        resolve(outputFile);
      });

      return;
    }

    // CASE 2: PDF → XLSX
    if (inputExt === ".pdf" && safeFormat === "xlsx") {
      const outputFile = path.join(outputDir, path.parse(inputPath).name + ".xlsx");
      const scriptPath = path.join(PYTHON_SCRIPTS_DIR, "pdfToExcel.py");

      const pyCommand = `"${PYTHON_PATH}" "${scriptPath}" "${inputPath}" "${outputFile}"`;
      console.log("🐍 Running Python PDF→Excel:", pyCommand);

      exec(pyCommand, (err, stdout, stderr) => {
        console.log("📤 Python stdout:", stdout);
        console.log("⚠️ Python stderr:", stderr);
        if (err) return reject(err);
        resolve(outputFile);
      });

      return;
    }

    console.log("DEBUG:", inputExt, safeFormat);

    // CASE: IMAGE & PDF → IMAGE (ImageMagick)
    if (
      [".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(inputExt) &&
      ["png", "jpg", "jpeg"].includes(safeFormat)
    ) {
      const outputFile = path.join(
        outputDir,
        path.parse(inputPath).name + "." + safeFormat
      );

      const command = `"${MAGICK_PATH}" -density 300 "${inputPath}" "${outputFile}"`;
      console.log("🖼 Running ImageMagick:", command);

      exec(command, (err, stdout, stderr) => {
        console.log("stdout:", stdout);
        console.log("stderr:", stderr);
        if (err) return reject(err);
        return resolve(outputFile);
      });

      return;
    }


    // CASE 3: LibreOffice conversions
    const command = `soffice --headless --convert-to ${safeFormat} "${inputPath}" --outdir "${outputDir}"`;
    console.log("🖥 Running LibreOffice command:", command);

    exec(command, (err, stdout, stderr) => {
      console.log("📤 LibreOffice stdout:", stdout);
      console.log("⚠️ LibreOffice stderr:", stderr);
      if (err) return reject(err);

      fs.readdir(outputDir, (err, files) => {
        if (err) return reject(err);
        if (!files.length) return reject("No output file created");

        const newestFile = files
          .map(f => ({ file: path.join(outputDir, f), time: fs.statSync(path.join(outputDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time)[0].file;

        resolve(newestFile);
      });
    });
  });
};
