/**
 * Ghostscript utility for PDF flattening and conversion.
 * On Windows uses gswin64c; on Unix uses gs.
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PDFDocument } from 'pdf-lib';

const GS_WINDOWS_CANDIDATES = [
  'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
  'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
  'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
  'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe',
];

function isValidGhostscriptBinary(candidatePath) {
  if (!candidatePath || typeof candidatePath !== 'string') return false;
  if (!fs.existsSync(candidatePath)) return false;
  const base = path.basename(candidatePath).toLowerCase();
  return base === 'gswin64c.exe' || base === 'gs.exe' || base === 'gs';
}

function resolveGhostscriptExe() {
  if (process.env.GS_EXE && isValidGhostscriptBinary(process.env.GS_EXE)) return process.env.GS_EXE;
  if (process.env.GS_PATH && isValidGhostscriptBinary(process.env.GS_PATH)) return process.env.GS_PATH;
  if (process.platform === 'win32') {
    for (const candidate of GS_WINDOWS_CANDIDATES) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return 'gswin64c';
  }
  return 'gs';
}

const GS_EXE = resolveGhostscriptExe();

/**
 * Ensure Ghostscript exists BEFORE redaction starts
 */
function assertGhostscript() {
  try {
    execSync(`"${GS_EXE}" -version`, { stdio: 'ignore' });
  } catch {
    throw new Error(
      `Ghostscript (${GS_EXE}) is not installed or not in PATH. ` +
      `Redaction cannot be safely performed.`
    );
  }
}

/**
 * Run Ghostscript with arguments
 */
function runGs(args) {
  return new Promise((resolve, reject) => {
    console.log('\n[GS COMMAND]');
    console.log(GS_EXE, args.join(' '));

    const gs = spawn(GS_EXE, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    gs.stdout.on('data', d => (stdout += d.toString()));
    gs.stderr.on('data', d => (stderr += d.toString()));

    gs.on('error', err => reject(err));

    gs.on('close', code => {
      if (code === 0) resolve();
      else {
        reject(
          new Error(
            `Ghostscript failed (code ${code})\n\nSTDERR:\n${stderr}\n\nSTDOUT:\n${stdout}`
          )
        );
      }
    });
  });
}

/**
 * TRUE PDF FLATTENING (image-only PDF)
 * - Handles Windows paths with spaces correctly
 * - Permanently destroys text layer
 */
async function flattenPdf(inputPath, outputPath, options = {}) {
  assertGhostscript();

  const dpi = options.dpi || 300;

  // Create safe temp directory (no spaces)
  const tempDir = path.join(
    os.tmpdir(),
    `gs_flatten_${Date.now()}`
  );


  fs.mkdirSync(tempDir, { recursive: true });

  const pagePattern = path.join(tempDir, 'page-%03d.png');

  try {
    // STEP 1: Rasterize PDF → PNG images (kills ALL text)
    await runGs([
      '-dSAFER',
      '-dNOPAUSE',
      '-dBATCH',
      '-dNOSAFER',
      '-sDEVICE=png16m',
      `-r${dpi}`,
      `-sOutputFile=${path.join(tempDir, 'page-%03d.png')}`,
      inputPath,
    ]);


    const files = fs
      .readdirSync(tempDir)
      .filter(f => f.endsWith('.png'))
      .sort();

    if (!files.length) {
      throw new Error('Ghostscript produced no rasterized pages');
    }

    const imagePaths = files.map(f => path.join(tempDir, f));

    // STEP 2: Assemble images → image-only PDF using pdf-lib
    const outDoc = await PDFDocument.create();

    for (const imagePath of imagePaths) {
      const imageBytes = fs.readFileSync(imagePath);
      const image = await outDoc.embedPng(imageBytes);
      const { width, height } = image;
      const page = outDoc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    const pdfBytes = await outDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
  } finally {
    // Cleanup temp files
    try {
      fs.readdirSync(tempDir).forEach(f =>
        fs.unlinkSync(path.join(tempDir, f))
      );
      fs.rmdirSync(tempDir);
    } catch (_) {}
  }
}

export { runGs, flattenPdf, assertGhostscript, GS_EXE };
