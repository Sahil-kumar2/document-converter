import multer from "multer";
import path from "path";
import fs from "fs";


export const deleteFile = async (p) => {
  await fs.promises.unlink(p).catch(() => {});
};




const uploadDir = "uploads/original";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

export default upload;