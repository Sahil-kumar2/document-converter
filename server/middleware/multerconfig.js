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
   MULTER INSTANCE
=========================== */

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE
      ? Number(process.env.MAX_FILE_SIZE)
      : 50 * 1024 * 1024, // default 50MB
  },
});

/* ===========================
   COMMON UPLOAD MODES
=========================== */

// Single PDF (most tools)
export const uploadSinglePdf = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 }, // legacy support
]);

// Multiple PDFs (merge, organize, etc.)
export const uploadMultiplePdfs = upload.array("pdfFiles", 10);

// PDF + watermark image
export const uploadPdfWithWatermark = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 },
  { name: "watermarkImage", maxCount: 1 },
  { name: "watermarkImage ", maxCount: 1 },
]);

// Generic single file (convert tools) - field name: "file"
export const uploadSingleFile = upload.single("file");


// Generic multiple files (convert tools) - field name: "files"
export const uploadMultipleFiles = upload.array("files", 10);

// Single image file - field name: "image"
export const uploadSingleImage = upload.single("image");

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
