import { exec, execFile } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import archiver from "archiver";

const PYTHON_PATH = "C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python314\\python.exe";
const MAGICK_PATH = "C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe";
const WKHTMLTOPDF_PATH = "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe";
const PDFTOHTML_PATH = "C:\\Users\\ASUS\\Release-25.12.0-0\\poppler-25.12.0\\Library\\bin\\pdftohtml.exe";
const GHOSTSCRIPT_PATH = "C:\\Users\\ASUS\\gs10060w64.exe";

// recreate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPTS_DIR = path.join(__dirname, "../../python");

export const runConversion = (inputPath, outputDir, format) => {
  return new Promise((resolve, reject) => {
    const safeFormat = format.trim().toLowerCase();
    const inputExt = path.extname(inputPath).toLowerCase();

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // ===============================
    // PDF → DOCX
    // ===============================
    if (inputExt === ".pdf" && safeFormat === "docx") {
      const outputFile = path.join(outputDir, path.parse(inputPath).name + ".docx");
      const scriptPath = path.join(PYTHON_SCRIPTS_DIR, "pdfToDocx.py");

      const command = `"${PYTHON_PATH}" "${scriptPath}" "${inputPath}" "${outputFile}"`;
      exec(command, (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (err) return reject(err);
        resolve(outputFile);
      });
      return;
    }

    // ===============================
    // PDF → XLSX
    // ===============================
    if (inputExt === ".pdf" && safeFormat === "xlsx") {
      const outputFile = path.join(outputDir, path.parse(inputPath).name + ".xlsx");
      const scriptPath = path.join(PYTHON_SCRIPTS_DIR, "pdfToExcel.py");

      const command = `"${PYTHON_PATH}" "${scriptPath}" "${inputPath}" "${outputFile}"`;
      exec(command, (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        if (err) return reject(err);
        resolve(outputFile);
      });
      return;
    }

    // ===============================
    // HTML → PDF
    // ===============================
    if (inputExt === ".html" && safeFormat === "pdf") {
      const outputFile = path.join(outputDir, path.parse(inputPath).name + ".pdf");

      exec(
        `"${WKHTMLTOPDF_PATH}" "${inputPath}" "${outputFile}"`,
        (err, stdout, stderr) => {
          console.log(stdout);
          console.log(stderr);
          if (err) return reject(err);
          resolve(outputFile);
        }
      );
      return;
    }

    // ===============================
    // PDF → HTML
    // ===============================
    if (inputExt === ".pdf" && safeFormat === "html") {
      const outputFile = path.join(outputDir, path.parse(inputPath).name + ".html");

      exec(
        `"${PDFTOHTML_PATH}" -s -noframes "${inputPath}" "${outputFile}"`,
        (err, stdout, stderr) => {
          console.log(stdout);
          console.log(stderr);
          if (err) return reject(err);
          resolve(outputFile);
        }
      );
      return;
    }

    // ===============================
    // IMAGE → PDF
    // ===============================
    if (
      [".jpg", ".jpeg", ".png", ".webp"].includes(inputExt) &&
      safeFormat === "pdf"
    ) {
      const outputFile = path.join(outputDir, path.parse(inputPath).name + ".pdf");

      exec(
        `"${MAGICK_PATH}" convert "${inputPath}" -quality 100 "${outputFile}"`,
        (err, stdout, stderr) => {
          console.log(stdout);
          console.log(stderr);
          if (err) return reject(err);
          resolve(outputFile);
        }
      );
      return;
    }

    // ===============================
    // IMAGE / PDF → IMAGE
    // ===============================
    if (
      [".jpg", ".jpeg", ".png", ".webp", ".pdf"].includes(inputExt) &&
      ["png", "jpg", "jpeg"].includes(safeFormat)
    ) {
      const baseName = path.parse(inputPath).name;

      if (inputExt === ".pdf") {
        const outputPattern = path.join(outputDir, `${baseName}-%03d.${safeFormat}`);

        exec(
          `"${MAGICK_PATH}" -density 300 -define pdf:use-cropbox=true -define pdf:delegate="${GHOSTSCRIPT_PATH}" "${inputPath}" "${outputPattern}"`,
          async (err, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (err) return reject(err);

            const images = fs
              .readdirSync(outputDir)
              .filter(f => f.startsWith(baseName + "-"))
              .map(f => path.join(outputDir, f));

            if (!images.length) return reject("No images generated");

            const zipPath = path.join(outputDir, baseName + "-images.zip");
            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip");

            output.on("close", () => resolve(zipPath));
            archive.on("error", err => reject(err));

            archive.pipe(output);
            images.forEach(img =>
              archive.file(img, { name: path.basename(img) })
            );
            archive.finalize();
          }
        );
        return;
      }

      const outputFile = path.join(outputDir, baseName + "." + safeFormat);
      exec(`"${MAGICK_PATH}" "${inputPath}" "${outputFile}"`, (err) => {
        if (err) return reject(err);
        resolve(outputFile);
      });
      return;
    }

    // ===============================
    // ✅ LibreOffice (UPDATED TO execFile)
    // ===============================
    execFile(
      "soffice",
      [
        "--headless",
        "--convert-to",
        safeFormat,
        inputPath,
        "--outdir",
        outputDir,
      ],
      (err, stdout, stderr) => {
        console.log("📤 LibreOffice stdout:", stdout);
        console.log("⚠️ LibreOffice stderr:", stderr);
        if (err) return reject(err);

        fs.readdir(outputDir, (err, files) => {
          if (err) return reject(err);
          if (!files.length) return reject("No output file created");

          const newestFile = files
            .map(f => ({
              file: path.join(outputDir, f),
              time: fs.statSync(path.join(outputDir, f)).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time)[0].file;

          resolve(newestFile);
        });
      }
    );
  });
};
