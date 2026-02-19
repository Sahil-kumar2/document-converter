import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runOCR = (buffer) => {
  return new Promise((resolve, reject) => {

    const pythonPath = path.join(__dirname, "../../python/imageToText.py");

    const child = spawn("python", [pythonPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let output = "";
    let errorOutput = "";

    // 🔥 VERY IMPORTANT
    child.stdin.on("error", (err) => {
      console.error("STDIN ERROR:", err.message);
    });

    child.on("error", (err) => {
      console.error("SPAWN ERROR:", err.message);
      reject("Failed to start Python process");
    });

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("close", (code) => {

      if (code !== 0) {
        console.error("Python stderr:", errorOutput);
        return reject("Python OCR failed");
      }

      try {
        const parsed = JSON.parse(output);
        resolve(parsed);
      } catch (e) {
        reject("Invalid JSON from Python");
      }
    });

    // ✅ Write safely
    try {
      child.stdin.write(buffer);
      child.stdin.end();
    } catch (err) {
      console.error("WRITE ERROR:", err.message);
      reject("Failed writing to Python");
    }

  });
};
