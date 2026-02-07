import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Split PDF into multiple PDFs based on mode.
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{ mode: 'pages' | 'custom' | 'fixed', ranges?: Array<{from: number, to: number}>, mergeAll?: boolean }} options
 * @returns {Promise<{ type: 'zip' | 'pdf', path: string }>}
 */
async function splitPdf(inputPath, options) {
  const { mode, ranges, mergeAll } = options;
  const buffer = fs.readFileSync(inputPath);
  const srcDoc = await PDFDocument.load(buffer);
  const totalPages = srcDoc.getPageCount();

  if (totalPages === 0) {
    throw new Error('PDF has no pages');
  }

  // MODE 1: Split into individual pages
  if (mode === 'pages') {
    const tempDir = path.join(path.dirname(inputPath), `split-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPaths = [];

    // Create one PDF per page
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const bytes = await newDoc.save();
      const outPath = path.join(tempDir, `page-${i + 1}.pdf`);
      fs.writeFileSync(outPath, bytes);
      pdfPaths.push(outPath);
    }

    // Create ZIP
    const zipPath = path.join(path.dirname(inputPath), `split-pages-${Date.now()}.zip`);
    await createZipFromFiles(pdfPaths, zipPath);

    // Cleanup temp files
    pdfPaths.forEach((p) => fs.unlinkSync(p));
    fs.rmdirSync(tempDir);

    return { type: 'zip', path: zipPath };
  }

  // MODE 2 & 3: Custom ranges or Fixed ranges
  if (mode === 'custom' || mode === 'fixed') {
    if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
      throw new Error(`${mode} mode requires valid ranges array`);
    }

    // Validate all ranges
    for (const range of ranges) {
      if (!range.from || !range.to) {
        throw new Error('Each range must have "from" and "to" properties');
      }
      if (range.from < 1 || range.to > totalPages || range.from > range.to) {
        throw new Error(`Invalid range: ${range.from}-${range.to}. Pages must be between 1 and ${totalPages}`);
      }
    }

    // If mergeAll is true, create one PDF with all ranges
    if (mergeAll) {
      const mergedDoc = await PDFDocument.create();
      
      for (const range of ranges) {
        const indices = [];
        for (let p = range.from; p <= range.to; p++) {
          indices.push(p - 1); // Convert to 0-based
        }
        const copiedPages = await mergedDoc.copyPages(srcDoc, indices);
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      const bytes = await mergedDoc.save();
      const outPath = path.join(path.dirname(inputPath), `split-merged-${Date.now()}.pdf`);
      fs.writeFileSync(outPath, bytes);
      return { type: 'pdf', path: outPath };
    }

    // Otherwise, create separate PDFs for each range
    const tempDir = path.join(path.dirname(inputPath), `split-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const pdfPaths = [];

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const newDoc = await PDFDocument.create();
      
      // Copy pages in range
      const indices = [];
      for (let p = range.from; p <= range.to; p++) {
        indices.push(p - 1); // Convert to 0-based
      }
      
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((page) => newDoc.addPage(page));
      
      // Save this range PDF
      const bytes = await newDoc.save();
      const outPath = path.join(tempDir, `range-${i + 1}-pages-${range.from}-${range.to}.pdf`);
      fs.writeFileSync(outPath, bytes);
      pdfPaths.push(outPath);
    }

    // Create ZIP with all range PDFs
    const zipPath = path.join(path.dirname(inputPath), `split-ranges-${Date.now()}.zip`);
    await createZipFromFiles(pdfPaths, zipPath);

    // Cleanup temp files
    pdfPaths.forEach((p) => fs.unlinkSync(p));
    fs.rmdirSync(tempDir);

    return { type: 'zip', path: zipPath };
  }

  throw new Error('mode must be "pages", "custom", or "fixed"');
}

/**
 * Create a ZIP file from multiple PDF files.
 * Ensures proper finalization to prevent corrupted ZIPs.
 */
function createZipFromFiles(filePaths, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 5 } });
    
    // Handle stream events properly
    output.on('close', () => {
      console.log(`ZIP created: ${archive.pointer()} total bytes`);
      resolve();
    });
    
    output.on('error', (err) => {
      reject(new Error(`Output stream error: ${err.message}`));
    });
    
    archive.on('error', (err) => {
      reject(new Error(`Archive error: ${err.message}`));
    });
    
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err);
      } else {
        reject(err);
      }
    });

    // Pipe archive to output
    archive.pipe(output);

    // Add all files to archive
    filePaths.forEach((filePath) => {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      archive.file(filePath, { name: path.basename(filePath) });
    });

    // Finalize archive - CRITICAL for valid ZIP
    archive.finalize();
  });
}

export { splitPdf };
