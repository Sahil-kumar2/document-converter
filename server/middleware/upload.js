const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const allowed = [".pdf", ".docx", ".xlsx", ".pptx"];

module.exports = multer({
  storage,
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("File type not allowed"), false);
    cb(null, true);
  },
  limits: { fileSize: process.env.MAX_FILE_SIZE ? Number(process.env.MAX_FILE_SIZE) : Infinity },
});
