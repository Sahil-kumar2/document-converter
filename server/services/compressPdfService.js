import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

/**
 * Compress PDF using pdf-lib
 * @param {string} inputPath - Path to input PDF
 * @param {string} level - Compression level: 'low' | 'medium' | 'high'
 * @returns {Promise<{ outputPath: string, originalSize: number, compressedSize: number }>}
 */
export async function compressPdf(inputPath, level = 'medium') {
  const originalSize = fs.statSync(inputPath).size;
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  const outputPath = path.join(
    path.dirname(inputPath),
    `compressed-${Date.now()}.pdf`
  );
  
  // Save with compression based on level
  const saveOptions = {
    useObjectStreams: true,
  };
  
  // For medium and high compression, we'll strip metadata and unused objects
  if (level === 'medium' || level === 'high') {
    // Remove metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
  }
  
  const compressedBytes = await pdfDoc.save(saveOptions);
  fs.writeFileSync(outputPath, compressedBytes);
  
  const compressedSize = fs.statSync(outputPath).size;
  
  return {
    outputPath,
    originalSize,
    compressedSize,
  };
}
