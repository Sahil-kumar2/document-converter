import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Temp directory for uploaded PDFs (created if missing)
const TEMP_DIR = path.join(process.cwd(), 'temp', 'uploads');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Store files with unique names to avoid collisions
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `pdf-${uniqueSuffix}${ext}`);
  },
});

// Accept only PDF files
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// For single file with field name flexibility
const pdfFileFields = upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'pdfFile ', maxCount: 1 }
]);

// For multiple PDF files
const pdfFilesFields = upload.array('pdfFiles', 10);

export { upload, pdfFileFields, pdfFilesFields, TEMP_DIR };
