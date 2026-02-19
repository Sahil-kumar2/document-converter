
import sharp from "sharp";
import path from "path";
import fs from "fs";
import Tesseract from "tesseract.js";

export async function extractTextFromImage(inputPath) {
  const outputDir = "uploads";
  
  
  const processedPath = path.join(
    outputDir,
    "processed_" + Date.now() + path.extname(inputPath)
  );

  await sharp(inputPath)
    .grayscale()
    .negate() 
    .toFile(processedPath);

  
  const { data: { text } } = await Tesseract.recognize(
    processedPath,
    'eng',
    {
      logger: info => console.log(info), // Progress tracking (optional)
    }
  );


  const txtFilePath = path.join(
    outputDir,
    "ocr_" + Date.now() + ".txt"
  );

  const cleanedText = text;



  fs.writeFileSync(txtFilePath,cleanedText , 'utf-8');

  
  fs.unlinkSync(inputPath);
  fs.unlinkSync(processedPath);

  return txtFilePath;
}