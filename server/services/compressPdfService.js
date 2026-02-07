import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * Compress PDF using pdf-lib
 * @param {string} inputPath - Path to input PDF
 * @param {string} level - Compression level: 'low' | 'medium' | 'high'
 * @returns {Promise<{ outputPath: string, originalSize: number, compressedSize: number }>}
 */
const execAsync = promisify(exec);

const GS_LEVEL_MAP = {
  low: '/prepress',
  medium: '/printer',
  high: '/ebook',
};

const GS_LEVEL_FLAGS = {
  low: [
    '-dDownsampleColorImages=false',
    '-dDownsampleGrayImages=false',
    '-dDownsampleMonoImages=false',
  ],
  medium: [
    '-dColorImageResolution=150',
    '-dGrayImageResolution=150',
    '-dMonoImageResolution=300',
    '-dDownsampleColorImages=true',
    '-dDownsampleGrayImages=true',
    '-dDownsampleMonoImages=true',
  ],
  high: [
    '-dColorImageResolution=72',
    '-dGrayImageResolution=72',
    '-dMonoImageResolution=150',
  ],
};

const GS_WINDOWS_CANDIDATES = [
  'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
  'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
  'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
  'C:\\Program Files\\gs\\gs10.03.0\\bin\\gswin64c.exe',
];

function resolveGhostscriptCommand() {
  if (process.env.GS_PATH) return process.env.GS_PATH;
  if (process.platform === 'win32') {
    for (const candidate of GS_WINDOWS_CANDIDATES) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return 'gswin64c';
  }
  return 'gs';
}

async function ensureGhostscriptAvailable(gsCommand) {
  try {
    await execAsync(`"${gsCommand}" -version`, { windowsHide: true, maxBuffer: 1024 * 1024 });
  } catch (error) {
    const stderr = error?.stderr || '';
    const message = error?.message || '';
    const notFound = error?.code === 'ENOENT' || /not recognized|not found/i.test(stderr + message);
    if (notFound) {
      throw new Error(
        'Ghostscript not found. Install Ghostscript and ensure it is on PATH, or set GS_PATH to the full Ghostscript binary path.'
      );
    }
    throw error;
  }
}

export async function compressPdf(inputPath, level = 'medium') {
  const originalSize = fs.statSync(inputPath).size;
  const outputPath = path.join(
    path.dirname(inputPath),
    `compressed-${Date.now()}.pdf`
  );

  const normalizedLevel = (level || 'medium').toString().trim().toLowerCase();
  const pdfSettings = GS_LEVEL_MAP[normalizedLevel] || GS_LEVEL_MAP.medium;
  const levelFlags = GS_LEVEL_FLAGS[normalizedLevel] || GS_LEVEL_FLAGS.medium;
  const gsCommand = resolveGhostscriptCommand();
  await ensureGhostscriptAvailable(gsCommand);

  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=${pdfSettings}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    ...levelFlags,
    `-sOutputFile="${outputPath}"`,
    `"${inputPath}"`,
  ];

  const command = `"${gsCommand}" ${args.join(' ')}`;

  try {
    await execAsync(command, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    const message = error?.stderr || error?.message || 'Ghostscript compression failed';
    throw new Error(`Ghostscript error: ${message}`);
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error('Compression failed: output file not created');
  }

  const compressedSize = fs.statSync(outputPath).size;

  return {
    outputPath,
    originalSize,
    compressedSize,
  };
}
