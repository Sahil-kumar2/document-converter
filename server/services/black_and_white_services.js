import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function convertToBlackWhite(inputPath) {
  const outputDir = "uploads/processed";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(
    outputDir,
    "bw_" + path.basename(inputPath)
  );

  await sharp(inputPath)
    .grayscale()   
    .negate()      
    .toFile(outputPath);

  return outputPath;
}
