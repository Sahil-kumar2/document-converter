import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * low    -> light optimization
 * medium -> strong
 * high   -> aggressive
 */
const GS_LEVEL_MAP = {
  low: '/printer',
  medium: '/ebook',
  high: '/screen',
};

const GS_LEVEL_FLAGS = {
  /**
   * ✅ LOW → very light, high quality
   */
  low: [
    '-dDownsampleColorImages=true',
    '-dDownsampleGrayImages=true',
    '-dDownsampleMonoImages=true',

    '-dEncodeColorImages=true',

    '-dColorImageResolution=175',
    '-dGrayImageResolution=175',
    '-dMonoImageResolution=230',

    '-dAutoFilterColorImages=false',
    '-dAutoFilterGrayImages=false',
    '-dColorImageFilter=/DCTEncode',
    '-dGrayImageFilter=/DCTEncode',

    '-dJPEGQ=82',
  ],

  /**
   * ✅ MEDIUM → noticeable compression
   */
  medium: [
    '-dDownsampleColorImages=true',
    '-dDownsampleGrayImages=true',
    '-dDownsampleMonoImages=true',

    '-dColorImageResolution=150',
    '-dGrayImageResolution=150',
    '-dMonoImageResolution=200',

    '-dAutoFilterColorImages=false',
    '-dAutoFilterGrayImages=false',
    '-dColorImageFilter=/DCTEncode',
    '-dGrayImageFilter=/DCTEncode',

    '-dJPEGQ=60',
  ],

  /**
   * ✅ HIGH → heavy compression
   */
  high: [
    '-dDownsampleColorImages=true',
    '-dDownsampleGrayImages=true',
    '-dDownsampleMonoImages=true',

    '-dColorImageResolution=72',
    '-dGrayImageResolution=72',
    '-dMonoImageResolution=150',

    '-dAutoFilterColorImages=false',
    '-dAutoFilterGrayImages=false',
    '-dColorImageFilter=/DCTEncode',
    '-dGrayImageFilter=/DCTEncode',

    '-dJPEGQ=40',
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
    await execAsync(`"${gsCommand}" -version`, {
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    const stderr = error?.stderr || '';
    const message = error?.message || '';
    const notFound =
      error?.code === 'ENOENT' || /not recognized|not found/i.test(stderr + message);

    if (notFound) {
      throw new Error(
        'Ghostscript not found. Install it or set GS_PATH to the binary location.'
      );
    }
    throw error;
  }
}

export async function compressPdf(inputPath, level = 'medium') {
  if (!fs.existsSync(inputPath)) {
    throw new Error('Input file not found');
  }

  const originalSize = fs.statSync(inputPath).size;

  const outputPath = path.join(
    path.dirname(inputPath),
    `compressed-${Date.now()}.pdf`
  );

  const normalizedLevel = (level || 'medium').toLowerCase();
  const pdfSettings = GS_LEVEL_MAP[normalizedLevel] || GS_LEVEL_MAP.medium;
  const levelFlags = GS_LEVEL_FLAGS[normalizedLevel] || GS_LEVEL_FLAGS.medium;

  const gsCommand = resolveGhostscriptCommand();
  await ensureGhostscriptAvailable(gsCommand);

  const args = [
    '-sDEVICE=pdfwrite',
    `-dPDFSETTINGS=${pdfSettings}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',

    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dSubsetFonts=true',
    '-dEmbedAllFonts=true',

    ...levelFlags,

    `-sOutputFile="${outputPath}"`,
    `"${inputPath}"`,
  ];

  const command = `"${gsCommand}" ${args.join(' ')}`;

  await execAsync(command, {
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024,
  });

  if (!fs.existsSync(outputPath)) {
    throw new Error('Compression failed: output file not created');
  }

  const compressedSize = fs.statSync(outputPath).size;

  if (compressedSize >= originalSize) {
    fs.unlinkSync(outputPath);
    return {
      outputPath: inputPath,
      originalSize,
      compressedSize: originalSize,
      note: 'File already optimized',
    };
  }

  return {
    outputPath,
    originalSize,
    compressedSize,
  };
}
