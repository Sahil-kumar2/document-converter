import path from "path";
import fs from "fs";
import { runColorAccessibility } from "../services/colorblindnessPDFService.js";
import { cleanupPaths } from "../utils/fileCleanup.js";

const OUTPUT_DIR = path.join(process.cwd(), "outputs");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const normalizeMode = (mode) => {
  const raw = String(mode || "universal").toLowerCase().trim();

  if (["deuteranopia", "red-green", "rg"].includes(raw)) return "deuteranopia";
  if (["protanopia", "protan"].includes(raw)) return "protanopia";
  if (["tritanopia", "tritan"].includes(raw)) return "tritanopia";
  if (["contrast"].includes(raw)) return "contrast";
  if (["universal", "auto"].includes(raw)) return "universal";

  return "invalid";
};

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.toLowerCase());
  }
  return false;
};

const clampStrength = (value, fallback = 0.7) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;

  if (parsed > 1) return Math.min(parsed / 100, 1);
  return Math.max(0, Math.min(parsed, 1));
};

const validateUpload = (file) => {
  if (!file) return "File is required";

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) return "Unsupported file type";

  if (file.mimetype && !allowedMimeTypes.includes(file.mimetype))
    return "Unsupported MIME type";

  return null;
};

const buildOutputPath = (inputPath, suffix, ext) => {
  const base = `color-accessible-${suffix}-${Date.now()}`;
  return path.join(OUTPUT_DIR, `${base}${ext}`);
};

export const transformColorAccessibility = async (req, res, next) => {
  const file = req.file;

  const error = validateUpload(file);
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  // ✅ WRITE BUFFER TO TEMP FILE
  const tempInputPath = path.join(
    OUTPUT_DIR,
    `temp-${Date.now()}-${file.originalname}`
  );

  await fs.promises.writeFile(tempInputPath, file.buffer);

  const preview = toBoolean(req.body?.preview);
  const mode = normalizeMode(req.body?.mode);

  if (mode === "invalid") {
    cleanupPaths([tempInputPath]);
    return res.status(400).json({ success: false, error: "Invalid mode" });
  }

  const strength = clampStrength(req.body?.strength);
  const contrast = toBoolean(req.body?.contrast);
  const highlight = toBoolean(req.body?.highlight);
  const applyAllPages = toBoolean(req.body?.applyAllPages ?? true);

  const ext = path.extname(file.originalname).toLowerCase();
  const outputExt = preview ? ".png" : ext;

  const outputPath = buildOutputPath(tempInputPath, preview ? "preview" : "final", outputExt);
  const metricsPath = buildOutputPath(tempInputPath, "metrics", ".json");

  try {
    const result = await runColorAccessibility({
      inputPath: tempInputPath,
      outputPath,
      mode,
      strength,
      contrast,
      highlight,
      preview,
      applyAllPages,
      metricsPath,
      timeoutMs: preview ? 2 * 60 * 1000 : undefined,
    });

    if (preview) {
      res.setHeader("Content-Type", "image/png");
      return res.sendFile(path.resolve(outputPath), () => {
        cleanupPaths([tempInputPath, outputPath, metricsPath], 5000);
      });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(outputPath)}"`
    );

    return res.sendFile(path.resolve(outputPath), () => {
      cleanupPaths([tempInputPath, outputPath, metricsPath], 5000);
    });

  } catch (err) {
    cleanupPaths([tempInputPath, outputPath, metricsPath]);
    next(err);
  }
};