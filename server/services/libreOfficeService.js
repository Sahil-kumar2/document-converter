import { exec, execFile } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import archiver from "archiver";
import CloudConvert from "cloudconvert";
import puppeteer from "puppeteer";

const PYTHON_PATH = "C:\\Users\\sahil\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";
const MAGICK_PATH = "C:\\Program Files\\ImageMagick-7.1.2-Q16-HDRI\\magick.exe";
const WKHTMLTOPDF_PATH = "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe";
const PDFTOHTML_PATH = "C:\\Users\\user\\AppData\\Local\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin\\pdftohtml.exe"
const GHOSTSCRIPT_PATH = "C:\\Users\\ASUS\\gs10060w64.exe";
const LIBREOFFICE_PATH = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY, true);

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
      const baseName = path.parse(inputPath).name + "-" + Date.now();
      const outputFile = path.join(outputDir, baseName + ".docx");
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
      const baseName = path.parse(inputPath).name + "-" + Date.now();
      const outputFile = path.join(outputDir, baseName + ".xlsx");
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
    // HTML → PDF (Puppeteer)
    // ===============================
    if (inputExt === ".html" && safeFormat === "pdf") {
      const baseName = path.parse(inputPath).name + "-" + Date.now();
      const outputFile = path.join(outputDir, baseName + ".pdf");

      (async () => {
        try {
          const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });

          const page = await browser.newPage();

          // Load local HTML file
          await page.goto(`file://${inputPath}`, {
            waitUntil: "networkidle0",
          });

          // Optional viewport (prevents layout breaking)
          await page.setViewport({
            width: 1280,
            height: 800,
          });

          await page.pdf({
            path: outputFile,
            format: "A4",
            printBackground: true,
            margin: {
              top: "20mm",
              bottom: "20mm",
              left: "15mm",
              right: "15mm",
            },
          });

          await browser.close();

          resolve(outputFile);
        } catch (error) {
          reject(error);
        }
      })();

      return;
    }


    // ===============================
    // PDF → HTML
    // ===============================
    if (inputExt === ".pdf" && safeFormat === "html") {
      const baseName = path.parse(inputPath).name + "-" + Date.now();
      const outputFile = path.join(outputDir, baseName + ".html");

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
      const baseName = path.parse(inputPath).name + "-" + Date.now();
      const outputFile = path.join(outputDir, baseName + ".pdf");

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
      const baseName = path.parse(inputPath).name + "-" + Date.now();

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


    console.log("CloudConvert Key:", process.env.CLOUDCONVERT_API_KEY);
    // ===============================
    // PDF → PPTX (CloudConvert)
    // ===============================
    if (inputExt === ".pdf" && safeFormat === "pptx") {

      (async () => {
        try {
          const job = await cloudConvert.jobs.create({
            tasks: {
              import_upload: { operation: "import/upload" },
              convert: {
                operation: "convert",
                input: "import_upload",
                output_format: "pptx",
              },
              export_file: {
                operation: "export/url",
                input: "convert",
              },
            },
          });

          const uploadTask = job.tasks.find(t => t.name === "import_upload");

          await cloudConvert.tasks.upload(
            uploadTask,
            fs.createReadStream(inputPath)
          );

          const completedJob = await cloudConvert.jobs.wait(job.id);

          const exportTask = completedJob.tasks.find(
            t => t.name === "export_file"
          );

          const fileUrl = exportTask.result.files[0].url;

          const response = await fetch(fileUrl);
          const buffer = Buffer.from(await response.arrayBuffer());

          const baseName = path.parse(inputPath).name + "-" + Date.now();
          const outputFile = path.join(outputDir, baseName + ".pptx");

          fs.writeFileSync(outputFile, buffer);

          resolve(outputFile);

        } catch (error) {
          reject(error);
        }
      })();

      return;
    }


    // ===============================
    // ✅ LibreOffice (UPDATED TO execFile)
    // ===============================
    execFile(
      LIBREOFFICE_PATH,
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

        const outputFile = path.join(
          outputDir,
          path.parse(inputPath).name + "." + safeFormat
        );

        resolve(outputFile);
      }
    );
  });
};
