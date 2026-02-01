import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function convertToBlackWhite(inputPath) {
  const outputDir = "uploads";
  
  const outputPath = path.join(
    outputDir,
    "bw_" + Date.now() + path.extname(inputPath)
  );

  await sharp(inputPath)
    .grayscale()
    .negate()
    .toFile(outputPath);

  // Original/temp image delete kar do
  fs.unlinkSync(inputPath);

  return outputPath;
}