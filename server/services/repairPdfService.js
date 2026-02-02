import { PDFDocument } from 'pdf-lib';
import path from 'path';
import fs from 'fs';

/**
 * Repair corrupted PDF using pdf-lib
 * Attempts to load and re-save the PDF to fix minor corruption issues
 * @param {string} inputPath - Path to input PDF
 * @returns {Promise<string>} - Path to repaired PDF
 */
export async function repairPdf(inputPath) {
  try {
    const pdfBytes = fs.readFileSync(inputPath);
    
    // Try to load PDF with lenient parsing
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    
    const outputPath = path.join(
      path.dirname(inputPath),
      `repaired-${Date.now()}.pdf`
    );
    
    // Re-save the PDF which can fix minor corruption
    const repairedBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, repairedBytes);
    
    return outputPath;
  } catch (error) {
    // If loading fails, the PDF is too corrupted
    throw new Error('PDF is too corrupted to repair');
  }
}
