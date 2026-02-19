import sharp from "sharp";
import archiver from "archiver";
import fs from "fs/promises";

export async function convertToBlackWhiteZip(files, res) {
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(res);

  try {
    for (const file of files) {
      const processedBuffer = await sharp(file.path)
        .grayscale()
        .toBuffer();

      archive.append(processedBuffer, {
        name: `bw_${file.originalname}`,
      });
    }

    await archive.finalize();
  } finally {
    // 🔥 Always cleanup uploaded temp files
    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error("Unlink error:", err.message);
        }
      })
    );
  }
}
