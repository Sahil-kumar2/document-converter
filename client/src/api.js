import axios from "axios";

// Backend base URL - can be configured via environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for large file conversions
});

// ============================================================
// FILE CONVERSION APIs (PDF/Images/Docs)
// ============================================================

/**
 * Convert file to target format
 * Supported conversions:
 * - PDF → DOCX, XLSX, PNG, JPG
 * - DOCX → PDF
 * - XLSX → PDF
 * - PPT/PPTX → PDF
 * - JPG/JPEG/PNG/WEBP → PNG/JPG
 * 
 * @param {File} file - File to convert
 * @param {string} targetFormat - Target format (e.g., 'docx', 'pdf', 'png')
 * @returns {Promise<Blob>} - Converted file as blob
 */
export const convertFile = async (file, targetFormat) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetFormat", targetFormat);

  return apiClient.post("/api/convert", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

// ============================================================
// PDF OPERATIONS APIs
// ============================================================

/**
 * Split PDF into multiple files
 * @param {File} pdfFile - PDF file to split
 * @param {string} splitType - "each" (split each page) or "range" (split by page ranges)
 * @param {string} [pageRanges] - Required if splitType is "range". Format: "1-3,5-7"
 * @returns {Promise<Blob>} - ZIP file with split PDFs or single PDF
 */
export const splitPdf = async (pdfFile, splitType, pageRanges = null) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("splitType", splitType);
  if (pageRanges) {
    formData.append("pageRanges", pageRanges);
  }

  return apiClient.post("/api/pdf/split", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Extract specific pages from PDF
 * @param {File} pdfFile - PDF file
 * @param {string} pageNumbers - Pages to extract. Format: "2,4,6-8"
 * @returns {Promise<Blob>} - PDF with extracted pages
 */
export const extractPdf = async (pdfFile, pageNumbers) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("pageNumbers", pageNumbers);

  return apiClient.post("/api/pdf/extract", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Rotate PDF pages
 * @param {File} pdfFile - PDF file
 * @param {number} rotationAngle - 90, 180, or 270 degrees
 * @param {string} [pageNumbers] - Optional specific pages. Format: "1-3,5"
 * @returns {Promise<Blob>} - Rotated PDF
 */
export const rotatePdf = async (pdfFile, rotationAngle, pageNumbers = null) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("rotationAngle", rotationAngle);
  if (pageNumbers) {
    formData.append("pageNumbers", pageNumbers);
  }

  return apiClient.post("/api/pdf/rotate", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Crop PDF pages
 * @param {File} pdfFile - PDF file
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Crop width
 * @param {number} height - Crop height
 * @param {string} [pageNumbers] - Optional specific pages
 * @returns {Promise<Blob>} - Cropped PDF
 */
export const cropPdf = async (pdfFile, x, y, width, height, pageNumbers = null) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("cropX", x);
  formData.append("cropY", y);
  formData.append("cropWidth", width);
  formData.append("cropHeight", height);
  if (pageNumbers) {
    formData.append("pageNumbers", pageNumbers);
  }

  return apiClient.post("/api/pdf/crop", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Add watermark to PDF
 * @param {File} pdfFile - PDF file
 * @param {string} watermarkText - Watermark text
 * @param {string} position - "center", "top", or "bottom"
 * @param {number} opacity - 0 to 1 (e.g., 0.3)
 * @param {number} fontSize - Font size for watermark
 * @param {string} [pageNumbers] - Optional specific pages
 * @returns {Promise<Blob>} - PDF with watermark
 */
export const watermarkPdf = async (
  pdfFile,
  watermarkText,
  position = "center",
  opacity = 0.3,
  fontSize = 48,
  pageNumbers = null
) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("watermarkText", watermarkText);
  formData.append("position", position);
  formData.append("opacity", opacity);
  formData.append("fontSize", fontSize);
  if (pageNumbers) {
    formData.append("pageNumbers", pageNumbers);
  }

  return apiClient.post("/api/pdf/watermark", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Redact content from PDF
 * @param {File} pdfFile - PDF file
 * @param {string} [redactText] - Text to redact
 * @param {string} [redactAreas] - Areas to redact
 * @param {string} [pageNumbers] - Optional specific pages
 * @returns {Promise<Blob>} - Redacted PDF
 */
export const redactPdf = async (
  pdfFile,
  redactText = null,
  redactAreas = null,
  pageNumbers = null
) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  if (redactText) formData.append("redactText", redactText);
  if (redactAreas) formData.append("redactAreas", redactAreas);
  if (pageNumbers) formData.append("pageNumbers", pageNumbers);

  return apiClient.post("/api/pdf/redact", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Convert PDF to PDF/A format for archival
 * @param {File} pdfFile - PDF file
 * @param {string} pdfaLevel - "PDF/A-1b", "PDF/A-2b", or "PDF/A-3b"
 * @returns {Promise<Blob>} - PDF/A compliant PDF
 */
export const convertToPdfa = async (pdfFile, pdfaLevel = "PDF/A-2b") => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("pdfaLevel", pdfaLevel);

  return apiClient.post("/api/pdf/pdfa", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

// ============================================================
// IMAGE OPERATIONS APIs
// ============================================================

/**
 * Convert image to black and white
 * @param {File} imageFile - Image file
 * @returns {Promise<Blob>} - Processed image as blob
 */
export const convertToBlackWhite = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  return apiClient.post("/api/black-and-white-image/black-white", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Extract text from image (OCR)
 * @param {File} imageFile - Image file
 * @returns {Promise<Blob>} - Text file as blob
 */
export const extractTextFromImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  return apiClient.post("/api/imageToText/getText", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

// ============================================================
// EXCEL OPERATIONS APIs
// ============================================================

/**
 * Merge multiple Excel files
 * @param {File[]} excelFiles - Array of Excel files
 * @returns {Promise<Object>} - { success, message, file }
 */
export const mergeExcelFiles = async (excelFiles) => {
  const formData = new FormData();
  excelFiles.forEach((file) => {
    formData.append("files", file);
  });

  return apiClient.post("/api/excel/merge-excel", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ============================================================
// AI IMAGE GENERATION API
// ============================================================

/**
 * Generate image from text prompt using AI (Gemini)
 * @param {string} prompt - Text description for image generation
 * @returns {Promise<Object>} - { success, output }
 */
export const generateImageFromPrompt = async (prompt) => {
  return apiClient.post("/api/imageGeneration/generate-image", {
    prompt,
  });
};

// ============================================================
// NEW PDF TOOLS APIs
// ============================================================

/**
 * Compress PDF
 * @param {File} pdfFile - PDF file to compress
 * @param {string} compressionLevel - "low" | "medium" | "high"
 * @returns {Promise<Blob>} - Compressed PDF
 */
export const compressPdf = async (pdfFile, compressionLevel = "medium") => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("compressionLevel", compressionLevel);

  return apiClient.post("/api/pdf/compress", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Merge multiple PDFs into one
 * @param {File[]} pdfFiles - Array of PDF files to merge (in order)
 * @returns {Promise<Blob>} - Merged PDF
 */
export const mergePdfs = async (pdfFiles) => {
  const formData = new FormData();
  pdfFiles.forEach((file) => {
    formData.append("pdfFiles", file);
  });

  return apiClient.post("/api/pdf/merge", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Remove specific pages from PDF
 * @param {File} pdfFile - PDF file
 * @param {string} pageRanges - Pages to remove. Format: "1,3,5-7"
 * @returns {Promise<Blob>} - PDF with pages removed
 */
export const removePages = async (pdfFile, pageRanges) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("pageRanges", pageRanges);

  return apiClient.post("/api/pdf/remove-pages", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Repair corrupted PDF
 * @param {File} pdfFile - PDF file to repair
 * @returns {Promise<Blob>} - Repaired PDF
 */
export const repairPdf = async (pdfFile) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);

  return apiClient.post("/api/pdf/repair", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

// ============================================================
// Error Handling Utility
// ============================================================

/**
 * Handle API errors and return user-friendly messages
 * @param {Error} error - Axios error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "An error occurred. Please try again.";
};

export default apiClient;
