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
  if (["deuteranopia", "red-green", "redgreen", "rg"].includes(raw)) {
    return "deuteranopia";
  }
  if (["protanopia", "red", "protan"].includes(raw)) {
    return "protanopia";
  }
  if (["tritanopia", "blue-yellow", "tritan"].includes(raw)) {
    return "tritanopia";
  }
  if (["universal", "auto"].includes(raw)) {
    return "universal";
  }
  if (["contrast", "contrast-only", "contrast_only"].includes(raw)) {
    return "contrast";
  }
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
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed > 1) {
    return Math.max(0, Math.min(1, parsed / 100));
  }
  return Math.max(0, Math.min(1, parsed));
};

const validateUpload = (file) => {
  if (!file?.path) {
    return "File is required";
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return "Unsupported file type";
  }

  if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
    return "Unsupported MIME type";
  }

  return null;
};

const buildOutputPath = (inputPath, suffix, forceExt = null) => {
  const ext = forceExt || path.extname(inputPath);
  const base = `color-accessible-${suffix}-${Date.now()}`;
  return path.join(OUTPUT_DIR, `${base}${ext}`);
};

const sendFileWithCleanup = (res, filePath, cleanupList) => {
  res.sendFile(path.resolve(filePath), (err) => {
    cleanupPaths(cleanupList, 5000);
    if (err) {
      console.error(err);
    }
  });
};

export const processColorAccessibility = async (req, res, next) => {
  const file = req.file;
  const validationError = validateUpload(file);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const mode = normalizeMode(req.body?.mode);
  if (mode === "invalid") {
    cleanupPaths([file.path]);
    return res.status(400).json({
      success: false,
      error: "Invalid mode",
    });
  }

  const strength = clampStrength(req.body?.strength ?? req.body?.intensity);
  const contrast = toBoolean(req.body?.contrast);
  const highlight = toBoolean(req.body?.highlight);
  const applyAllPages = toBoolean(req.body?.applyAllPages ?? true);

  const ext = path.extname(file.originalname).toLowerCase();
  const outputExt = ext === ".pdf" ? ".pdf" : ext;
  const outputPath = buildOutputPath(file.path, "final", outputExt);
  const metricsPath = buildOutputPath(file.path, "metrics", ".json");

  try {
    const result = await runColorAccessibility({
      inputPath: file.path,
      outputPath,
      mode,
      strength,
      contrast,
      highlight,
      preview: false,
      metricsPath,
      applyAllPages,
    });

    if (result?.metrics) {
      res.setHeader("X-Accessibility-Score", String(result.metrics.score));
      res.setHeader("X-Accessibility-Issues", String(result.metrics.issues));
      if (result.metrics.deltaE !== undefined) {
        res.setHeader("X-Accessibility-DeltaE", String(result.metrics.deltaE));
      }
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(outputPath)}"`
    );

    sendFileWithCleanup(res, outputPath, [file.path, outputPath, metricsPath]);
  } catch (error) {
    cleanupPaths([file.path, outputPath, metricsPath]);
    next(error);
  }
};

export const previewColorAccessibility = async (req, res, next) => {
  const file = req.file;
  const validationError = validateUpload(file);
  if (validationError) {
    return res.status(400).json({ success: false, error: validationError });
  }

  const previewType = String(req.body?.previewType || "processed").toLowerCase();
  const mode = previewType === "original" ? "original" : normalizeMode(req.body?.mode);

  if (mode === "invalid") {
    cleanupPaths([file.path]);
    return res.status(400).json({
      success: false,
      error: "Invalid mode",
    });
  }

  const strength = clampStrength(req.body?.strength ?? req.body?.intensity);
  const contrast = toBoolean(req.body?.contrast);
  const highlight = toBoolean(req.body?.highlight);

  const outputPath = buildOutputPath(file.path, "preview", ".png");
  const metricsPath = buildOutputPath(file.path, "preview-metrics", ".json");

  try {
    const result = await runColorAccessibility({
      inputPath: file.path,
      outputPath,
      mode,
      strength,
      contrast,
      highlight,
      preview: true,
      metricsPath,
      applyAllPages: true,
      timeoutMs: 2 * 60 * 1000,
    });

    if (result?.metrics) {
      res.setHeader("X-Accessibility-Score", String(result.metrics.score));
      res.setHeader("X-Accessibility-Issues", String(result.metrics.issues));
      if (result.metrics.deltaE !== undefined) {
        res.setHeader("X-Accessibility-DeltaE", String(result.metrics.deltaE));
      }
    }

    res.setHeader("Content-Type", "image/png");
    sendFileWithCleanup(res, outputPath, [file.path, outputPath, metricsPath]);
  } catch (error) {
    cleanupPaths([file.path, outputPath, metricsPath]);
    next(error);
  }
};