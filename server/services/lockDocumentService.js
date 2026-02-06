import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import archiver from "archiver"
import zipEncrypted from "archiver-zip-encrypted";

import { fileURLToPath } from "url";


archiver.registerFormat("zip-encrypted", zipEncrypted);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ HARD CODED – REAL PYTHON (NOT WindowsApps)
const PYTHON =  "C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python314\\python.exe";

// safety check (optional but helpful)
if (!fs.existsSync(PYTHON)) {
  console.error("❌ Python not found at:", PYTHON);
}

const outputDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const pythonScript = (script) =>
  path.join(__dirname, "..","..", "python", script);

export const lockPdf = (filePath, password) =>
  new Promise((resolve, reject) => {
    const output = path.join(outputDir, `locked-${Date.now()}.pdf`);

    execFile(
      PYTHON,
      [pythonScript("lockPdf.py"), filePath, output, password],
      (err, stdout, stderr) => {
        if (stderr) console.error("PY STDERR:", stderr);
        if (err) return reject(err);
        resolve(output);
      }
    );
  });

export const zipFile = (filePath, password) =>
  new Promise((resolve, reject) => {
    const output = path.join(outputDir, `secured-${Date.now()}.zip`);
    const outputStream = fs.createWriteStream(output);

    const archive = archiver("zip-encrypted", {
      zlib: { level: 8 },
      encryptionMethod: "aes256",
      password,
    });

    outputStream.on("close", () => resolve(output));
    archive.on("error", (err) => reject(err));

    archive.pipe(outputStream);
    archive.file(filePath, { name: path.basename(filePath) });
    archive.finalize();
  });
