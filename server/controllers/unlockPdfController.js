import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { deleteFile } from "../middleware/multerconfig.js";

export const unlockPdfController = async (req, res) => {
  let outputPath;

  try {
    // ===============================
    // 1️⃣ Validate Request
    // ===============================
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const { password } = req.body;

    if (!password) {
      await deleteFile(req.file.path);
      return res.status(400).json({ error: "Password is required" });
    }

    const inputPath = req.file.path;
    outputPath = inputPath.replace(".pdf", `-unlocked-${Date.now()}.pdf`);

    const scriptPath = path.join(process.cwd(), "..", "python", "unlockPdf.py");

    // ===============================
    // 2️⃣ Python Path (ENV SAFE)
    // ===============================
    const pythonPath =
      process.env.PYTHON_PATH ||
      "C:\\Users\\sahil\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";

    console.log("🔓 Unlocking PDF...");
    console.log("Python Path:", pythonPath);
    console.log("Script Path:", scriptPath);
    console.log("Input Path:", inputPath);

    // ===============================
    // 3️⃣ Spawn Python Process
    // ===============================
    const pythonProcess = spawn(pythonPath, [
      scriptPath,
      inputPath,
      outputPath,
      password,
    ]);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("error", async (err) => {
      console.error("❌ Failed to start Python process:", err);
      await deleteFile(inputPath);
      return res.status(500).json({
        error: "Failed to execute unlock script",
      });
    });

    pythonProcess.on("close", async (code) => {
      console.log("PYTHON EXIT CODE:", code);
      console.log("PYTHON STDOUT:", stdoutData);
      console.log("PYTHON STDERR:", stderrData);

      if (code !== 0) {
        await deleteFile(inputPath);

        const message = (stderrData || stdoutData || "").toLowerCase();

        // 🔒 Restricted document case
        if (message.includes("restricted")) {
          return res.status(400).json({
            error: "This document cannot be unlocked.",
          });
        }

        // 🔑 Invalid password case
        if (message.includes("invalid password")) {
          return res.status(400).json({
            error: "Invalid password. Please try again.",
          });
        }

        // ⚠ Generic fallback
        return res.status(400).json({
          error: "Failed to unlock PDF.",
        });
      }

      // Check if output file exists
      if (!fs.existsSync(outputPath)) {
        await deleteFile(inputPath);
        return res.status(400).json({
          error: "Unlock failed: Output file not created",
        });
      }

      // Send unlocked file
      res.download(outputPath, "unlocked.pdf", async () => {
        await deleteFile(inputPath);
        await deleteFile(outputPath);
      });
    });


  } catch (error) {
    console.error("❌ Controller Error:", error);

    if (req.file?.path) {
      await deleteFile(req.file.path);
    }

    return res.status(500).json({
      error: "Server error while unlocking PDF",
    });
  }
};
