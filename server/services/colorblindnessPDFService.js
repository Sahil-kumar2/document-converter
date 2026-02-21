import { spawn } from "child_process";
import path from "path";
import fs from "fs";

// 🔥 Use env first, fallback to system python
const PYTHON = process.env.PYTHON_PATH || "python";

// 🔥 Resolve project root safely
const PROJECT_ROOT = path.resolve(process.cwd(), "..");

// 🔥 Python engine folder (based on your structure)
const ENGINE_DIR = path.join(PROJECT_ROOT, "python");

// 🔥 Python script
const PROCESSOR_PATH = path.join(ENGINE_DIR, "colorblindness.py");

// 🔍 Validate engine before running
const ensureEngine = () => {
  if (!fs.existsSync(PROCESSOR_PATH)) {
    throw new Error(
      `Python engine not found at ${PROCESSOR_PATH}`
    );
  }

  // If absolute python path given, validate it
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
      "--input", inputPath,
      "--output", outputPath,
      "--mode", mode,
      "--strength", String(strength),
      "--contrast", contrast ? "true" : "false",
      "--highlight", highlight ? "true" : "false",
      "--apply-all-pages", applyAllPages ? "true" : "false",
    ];

    if (preview) {
      args.push("--preview", "true");
    }

    if (metricsPath) {
      args.push("--metrics-output", metricsPath);
    }

    // 🔥 Spawn Python safely
    const child = spawn(PYTHON, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      cwd: ENGINE_DIR,
      shell: false, // important for Windows
    });

    let stderr = "";
    let stdout = "";

    // ⏳ Timeout protection
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Python processing timed out"));
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start Python process: ${err.message}`));
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
          metrics = JSON.parse(
            fs.readFileSync(metricsPath, "utf-8")
          );
        } catch {
          metrics = null;
        }
      }

      resolve({ outputPath, metrics });
    });
  });
};