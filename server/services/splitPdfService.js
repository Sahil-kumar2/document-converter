import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { parsePageRanges } from '../utils/pageRangeParser.js';

/**
 * Split PDF by "each" (one PDF per page) or "range" (one PDF from page ranges).
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{ splitType: 'each' | 'range', pageRanges?: string }} options
 * @returns {Promise<{ type: 'zip' | 'pdf', path: string, pageCount?: number }>}
 */
async function splitPdf(inputPath, options) {
  const { splitType, pageRanges } = options;
  const buffer = fs.readFileSync(inputPath);
  const srcDoc = await PDFDocument.load(buffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  if (splitType === 'each') {
    // One PDF per page → return ZIP
    const tempDir = path.join(path.dirname(inputPath), `split-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPaths = [];

    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const bytes = await newDoc.save();
      const outPath = path.join(tempDir, `page-${i + 1}.pdf`);
      fs.writeFileSync(outPath, bytes);
      pdfPaths.push(outPath);
    }

    const zipPath = path.join(path.dirname(inputPath), `split-${Date.now()}.zip`);
    await createZipFromFiles(pdfPaths, zipPath);

    // Clean up temp PDFs and temp dir
    pdfPaths.forEach((p) => fs.unlinkSync(p));
    fs.rmdirSync(tempDir);

    return { type: 'zip', path: zipPath, pageCount: totalPages };
  }

  if (splitType === 'range') {
    const { indices, error } = parsePageRanges(pageRanges || '', totalPages);
    if (error) throw new Error(error);
    if (indices.length === 0) {
      throw new Error('pageRanges is required for splitType "range" and must be valid (e.g. 1-3,5-7)');
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((p) => newDoc.addPage(p));
    const bytes = await newDoc.save();
    const outPath = path.join(path.dirname(inputPath), `split-range-${Date.now()}.pdf`);
    fs.writeFileSync(outPath, bytes);
    return { type: 'pdf', path: outPath, pageCount: indices.length };
  }

  throw new Error('splitType must be "each" or "range"');
}

function createZipFromFiles(filePaths, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 5 } });
    output.on('close', () => resolve());
    archive.on('error', reject);
    archive.pipe(output);
    filePaths.forEach((filePath) => {
      archive.file(filePath, { name: path.basename(filePath) });
    });
    archive.finalize();
  });
}

export { splitPdf };
