import fs from 'fs';
import path from 'path';

/**
 * Delete a file. No-op if file does not exist.
 * @param {string} filePath - Absolute or relative path
 */
function removeFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('Cleanup warning:', err.message);
  }
}

/**
 * Remove multiple files (e.g. temp PDFs after sending response).
 * @param {string[]} filePaths
 */
function removeFiles(filePaths) {
  (filePaths || []).forEach(removeFile);
}

export { removeFile, removeFiles };
