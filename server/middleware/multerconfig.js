import multer from "multer";
import path from "path";
import fs from "fs";

/* ===========================
   UPLOAD DIRECTORY
=========================== */

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ===========================
   FILE SIZE LIMITS (BY TYPE)
=========================== */

const parseSize = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const MAX_PDF_SIZE = parseSize(
  process.env.MAX_PDF_SIZE,
  100 * 1024 * 1024 // 100MB
);

export const MAX_IMAGE_SIZE = parseSize(
  process.env.MAX_IMAGE_SIZE,
  20 * 1024 * 1024 // 20MB
);

export const MAX_DOCUMENT_SIZE = parseSize(
  process.env.MAX_DOCUMENT_SIZE,
  50 * 1024 * 1024 // 50MB
);

export const MAX_EXCEL_SIZE = parseSize(
  process.env.MAX_EXCEL_SIZE,
  10 * 1024 * 1024 // 10MB
);

export const MAX_TOTAL_UPLOAD_SIZE = parseSize(
  process.env.MAX_TOTAL_UPLOAD_SIZE,
  200 * 1024 * 1024 // 200MB
);

export const MAX_CONVERT_SIZE = Math.max(
  MAX_PDF_SIZE,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_EXCEL_SIZE
);

/* ===========================
   FILE DELETE HELPER
=========================== */

export const deleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // silent fail (file may not exist)
  }
};

/* ===========================
   STORAGE CONFIG
=========================== */

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

/* ===========================
   FILE FILTER
=========================== */

const allowedExtensions = [
  ".pdf",
  ".docx", ".xlsx", ".pptx",
  ".jpg", ".jpeg", ".png", ".webp",
  ".html"
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const field = (file.fieldname || "").trim();

  // Watermark image support
  if (field === "watermarkImage") {
    if (file.mimetype?.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Only image files allowed for watermark"), false);
  }

  // General file support
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("File type not allowed"), false);
  }

  cb(null, true);
};

/* ===========================
   MULTER INSTANCES (BY TYPE)
=========================== */

const createUpload = (fileSize) =>
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize,
    },
  });

export const uploadPdf = createUpload(MAX_PDF_SIZE);
export const uploadImage = createUpload(MAX_IMAGE_SIZE);
export const uploadDocument = createUpload(MAX_DOCUMENT_SIZE);
export const uploadExcel = createUpload(MAX_EXCEL_SIZE);
export const uploadConvert = createUpload(MAX_CONVERT_SIZE);

// Backward-compatible default uploader (documents)
export const upload = uploadDocument;

/* ===========================
   COMMON UPLOAD MODES
=========================== */

// Single PDF (most tools)
export const uploadSinglePdf = uploadPdf.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 }, // legacy support
]);

// Multiple PDFs (merge, organize, etc.)
export const uploadMultiplePdfs = uploadPdf.array("pdfFiles", 10);

// PDF + watermark image
export const uploadPdfWithWatermark = uploadPdf.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 },
  { name: "watermarkImage", maxCount: 1 },
  { name: "watermarkImage ", maxCount: 1 },
]);

// Generic single file (convert tools) - field name: "file"
export const uploadSingleFile = uploadDocument.single("file");

// Generic single file for convert tools (uses max allowed size, then validates by type)
export const uploadSingleConvertFile = uploadConvert.single("file");

// Single image file - field name: "image"
export const uploadSingleImage = uploadImage.single("image");

// Backward compatibility exports
export const pdfFileFields = uploadSinglePdf;
export const pdfFilesFields = uploadMultiplePdfs;

// Utility middleware to normalize field names
export const normalizePdfFile = (req, res, next) => {
  if (req.files) {
    req.file = req.files["pdfFile"]?.[0] ?? req.files["pdfFile "]?.[0];
  }
  next();

};

/* ===========================
   SIZE VALIDATION MIDDLEWARES
=========================== */

const collectFiles = (req) => {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }
  return [];
};

export const validateTotalUploadSize = (maxTotalSize = MAX_TOTAL_UPLOAD_SIZE) => {
  return (req, res, next) => {
    const files = collectFiles(req);
    if (!files.length) return next();

    const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalSize > maxTotalSize) {
      return res.status(413).json({
        success: false,
        error: `Total upload size exceeds limit (${Math.round(maxTotalSize / 1024 / 1024)}MB)`,
      });
    }

    next();
  };
};

export const validateFileSizesByField = (fieldLimits = {}) => {
  return (req, res, next) => {
    const files = collectFiles(req);
    if (!files.length) return next();

    for (const file of files) {
      const limit = fieldLimits[file.fieldname];
      if (limit && file.size > limit) {
        return res.status(413).json({
          success: false,
          error: `File too large for ${file.fieldname} (${Math.round(limit / 1024 / 1024)}MB max)`,
        });
      }
    }

    next();
  };
};

export const validateFileSizeByExtension = (req, res, next) => {
  const file = req.file;
  if (!file) return next();

  const ext = path.extname(file.originalname).toLowerCase();
  let limit = MAX_DOCUMENT_SIZE;

  if (ext === ".pdf") limit = MAX_PDF_SIZE;
  else if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) limit = MAX_IMAGE_SIZE;
  else if (ext === ".xlsx") limit = MAX_EXCEL_SIZE;
  else if ([".docx", ".pptx", ".html"].includes(ext)) limit = MAX_DOCUMENT_SIZE;

  if (file.size > limit) {
    return res.status(413).json({
      success: false,
      error: `File too large for ${ext || "document"} (${Math.round(limit / 1024 / 1024)}MB max)`,
    });
  }

  next();
};
