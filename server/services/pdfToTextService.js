import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runPdfToTextOCR = (buffer) => {
  return new Promise((resolve, reject) => {

    const pythonPath = path.join(
      __dirname,
      "../../python/pdfToTextOCR.py"
    );

    const child = spawn("python", [pythonPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(errorOutput || "OCR failed");
      }
      resolve(output);
    });

    child.stdin.write(buffer);
    child.stdin.end();
  });
};
