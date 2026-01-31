/**
 * Ghostscript utility for PDF flattening and conversion.
 * On Windows uses gswin64c; on Unix uses gs.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GS_EXE =
  process.env.GS_EXE ||
  (process.platform === 'win32' ? 'gswin64c' : 'gs');

/**
 * Ensure Ghostscript exists BEFORE redaction starts
 */
function assertGhostscript() {
  try {
    execSync(`${GS_EXE} -version`, { stdio: 'ignore' });
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
  require('os').tmpdir(),
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

    const imagePaths = files.map(f => `"${path.join(tempDir, f)}"`);

    // STEP 2: Assemble images → image-only PDF
    await runGs([
      '-dSAFER',
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      '-sDEVICE=pdfwrite',
      '-dDetectDuplicateImages=false',
      '-dCompressFonts=false',
      '-dSubsetFonts=false',
      '-dPreserveAnnots=false',
      '-dPreserveOverprintSettings=false',
      `-sOutputFile="${outputPath}"`,
      ...imagePaths,
    ]);
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

module.exports = {
  runGs,
  flattenPdf,
  assertGhostscript,
  GS_EXE,
};
