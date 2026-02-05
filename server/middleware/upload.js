import multer from "multer";
import path from "path";
import fs from "fs";

// ================= FOLDERS =================
const TEMP_DIR = path.join(process.cwd(), "temp", "uploads");
const FINAL_DIR = path.join(process.cwd(), "uploads");

[TEMP_DIR, FINAL_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ================= DELETE HELPER =================
export const deleteFile = async (p) => {
  await fs.promises.unlink(p).catch(() => {});
};

// ================= STORAGE =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // PDFs for processing → temp, others → uploads
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".pdf") cb(null, TEMP_DIR);
    else cb(null, FINAL_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

// ================= ALLOWED TYPES =================
const allowedExt = [
  ".pdf", ".docx", ".xlsx", ".pptx",
  ".jpg", ".jpeg", ".png", ".webp", ".html"
];

// ================= FILTER =================
const fileFilter = (req, file, cb) => {
  const field = String(file.fieldname || "").trim();
  const ext = path.extname(file.originalname).toLowerCase();

  // watermark images
  if (field === "watermarkImage") {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    return cb(new Error("Only images allowed for watermarkImage"), false);
  }

  if (!allowedExt.includes(ext))
    return cb(new Error("File type not allowed"), false);

  cb(null, true);
};

// ================= MULTER INSTANCE =================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE
      ? Number(process.env.MAX_FILE_SIZE)
      : 50 * 1024 * 1024
  }
});

// ================= EXPORT MODES =================

// single flexible PDF field
export const pdfFileFields = upload.fields([
  { name: "pdfFile", maxCount: 1 },
  { name: "pdfFile ", maxCount: 1 }
]);

// multiple PDFs
export const pdfFilesFields = upload.array("pdfFiles", 10);

// generic single file
export const singleFile = upload.single("file");

// generic multiple
export const multipleFiles = upload.array("files", 10);

export default upload;
