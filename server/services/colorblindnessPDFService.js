import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HARD_CODED_PYTHON = "C:\\Users\\user\\AppData\\Local\\Python\\bin\\python.exe";
const PYTHON =
  process.env.PYTHON_PATH ||
  process.env.PYTHON ||
  (fs.existsSync(HARD_CODED_PYTHON) ? HARD_CODED_PYTHON : "python");
const ENGINE_DIR = path.join(__dirname, "..", "..", "python-engine");
const PROCESSOR_PATH = path.join(ENGINE_DIR, "colorblindness.py");

const ensureEngine = () => {
  if (!fs.existsSync(PROCESSOR_PATH)) {
    throw new Error("Python engine not found. processor.py is missing.");
  }
  if (path.isAbsolute(PYTHON) && !fs.existsSync(PYTHON)) {
    throw new Error(`Python executable not found at ${PYTHON}`);
  }
};

export const runColorAccessibility = async ({
  inputPath,
  outputPath,
  mode,
  strength,
  contrast,
  highlight,
  preview = false,
  metricsPath = null,
  applyAllPages = true,
  timeoutMs = 10 * 60 * 1000,
}) => {
  ensureEngine();

  return new Promise((resolve, reject) => {
    const args = [
      PROCESSOR_PATH,
      "--input",
      inputPath,
      "--output",
      outputPath,
      "--mode",
      mode,
      "--strength",
      String(strength),
      "--contrast",
      contrast ? "true" : "false",
      "--highlight",
      highlight ? "true" : "false",
    ];

    if (preview) {
      args.push("--preview", "true");
    }

    if (metricsPath) {
      args.push("--metrics-output", metricsPath);
    }

    args.push("--apply-all-pages", applyAllPages ? "true" : "false");

    const child = spawn(PYTHON, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      cwd: ENGINE_DIR,
    });

    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Python processing timed out"));
    }, timeoutMs);

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(
          new Error(stderr || `Python process failed with code ${code}`)
        );
      }

      let metrics = null;
      if (metricsPath && fs.existsSync(metricsPath)) {
        try {
          metrics = JSON.parse(fs.readFileSync(metricsPath, "utf-8"));
        } catch {
          metrics = null;
        }
      }

      resolve({ outputPath, metrics });
    });
  });
};