import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { GS_EXE } from '../utils/ghostscript.js';

const SUPPORTED_LEVELS = ['PDF/A-1b', 'PDF/A-2b', 'PDF/A-3b'];
const GS_PDFA_MAP = {
  'PDF/A-1b': '1',
  'PDF/A-2b': '2',
  'PDF/A-3b': '3',
};

/**
 * Convert PDF to PDF/A using Ghostscript (gs must be installed).
 * @param {string} inputPath - Path to uploaded PDF
 * @param {{ pdfaLevel?: string }} options - PDF/A-1b (default), PDF/A-2b, PDF/A-3b
 * @returns {Promise<{ path: string }>}
 */
function convertToPdfa(inputPath, options) {
  return new Promise((resolve, reject) => {
    const level = (options.pdfaLevel || 'PDF/A-1b').trim();
    if (!SUPPORTED_LEVELS.includes(level)) {
      return reject(new Error(`pdfaLevel must be one of: ${SUPPORTED_LEVELS.join(', ')}`));
    }

    const pdfaNum = GS_PDFA_MAP[level];
    const outPath = path.join(path.dirname(inputPath), `pdfa-${Date.now()}.pdf`);

    const args = [
      '-dPDFA=' + pdfaNum,
      '-dBATCH',
      '-dNOPAUSE',
      '-sDEVICE=pdfwrite',
      '-dPDFACompatibilityPolicy=1',
      '-sProcessColorModel=DeviceRGB',
      '-sOutputFile=' + outPath,
      inputPath,
    ];

    const gs = spawn(GS_EXE, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    gs.stderr.on('data', (data) => { stderr += data.toString(); });
    gs.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error(`Ghostscript (${GS_EXE}) is not installed or not in PATH. Install Ghostscript to convert to PDF/A.`));
      } else {
        reject(err);
      }
    });
    gs.on('close', (code) => {
      if (code === 0 && fs.existsSync(outPath)) {
        resolve({ path: outPath });
      } else {
        const msg = stderr.trim() || `Ghostscript exited with code ${code}`;
        if (fs.existsSync(outPath)) try { fs.unlinkSync(outPath); } catch (_) {}
        reject(new Error(`PDF/A conversion failed: ${msg}`));
      }
    });
  });
}

export { convertToPdfa, SUPPORTED_LEVELS };
