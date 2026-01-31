const fs = require('fs');
const path = require('path');

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

module.exports = { removeFile, removeFiles };
