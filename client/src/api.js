import axios from "axios";

// Backend base URL - can be configured via environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

  // Ensure files is always treated as an array
  const fileArray = Array.isArray(file) ? file : [file];

  fileArray.forEach((f) => {
    formData.append("files", f);   // IMPORTANT: must match backend
  });

  formData.append("targetFormat", targetFormat);

  return apiClient.post("/api/convert", formData, {
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
export const splitPdf = async (pdfFile, mode, ranges = null, mergeAll = false) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("mode", mode);
  formData.append("mergeAll", mergeAll.toString());
  
  if (ranges && Array.isArray(ranges)) {
    formData.append("ranges", JSON.stringify(ranges));
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
 * @param {Object|number} rotationData - Page rotation map {pageIndex: angle} or single angle for all
 * @param {string} [pageNumbers] - Optional specific pages (legacy). Format: "1-3,5"
 * @returns {Promise<Blob>} - Rotated PDF
 */
export const rotatePdf = async (pdfFile, rotationData, pageNumbers = null) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  
  // Support both new map format and legacy single angle
  if (typeof rotationData === 'object' && !Array.isArray(rotationData)) {
    formData.append("pageRotations", JSON.stringify(rotationData));
  } else {
    formData.append("rotationAngle", rotationData);
  }
  
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
export const cropPdf = async (pdfFile, x, y, width, height, mode = null, pageNumber = null, pageNumbers = null) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  formData.append("cropX", x);
  formData.append("cropY", y);
  formData.append("cropWidth", width);
  formData.append("cropHeight", height);
  
  // Support new mode-based format
  if (mode) {
    formData.append("mode", mode);
    if (mode === "current_page" && pageNumber) {
      formData.append("pageNumber", pageNumber);
    }
  }
  
  // Legacy support for pageNumbers
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
  pageNumbers = null,
  options = {}
) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  if (watermarkText !== undefined && watermarkText !== null) {
    formData.append("watermarkText", watermarkText);
  }
  formData.append("position", position);
  formData.append("opacity", opacity);
  formData.append("fontSize", fontSize);
  if (pageNumbers) {
    formData.append("pageNumbers", pageNumbers);
  }

  if (options?.type) formData.append("type", options.type);
  if (options?.xRatio !== undefined) formData.append("xRatio", options.xRatio);
  if (options?.yRatio !== undefined) formData.append("yRatio", options.yRatio);
  if (options?.scale !== undefined) formData.append("scale", options.scale);
  if (options?.rotation !== undefined) formData.append("rotation", options.rotation);
  if (options?.pageScope) formData.append("pageScope", options.pageScope);
  if (options?.pageNumber !== undefined) formData.append("pageNumber", options.pageNumber);
  if (options?.fontFamily) formData.append("fontFamily", options.fontFamily);
  if (options?.fontColor) formData.append("fontColor", options.fontColor);
  if (options?.bold !== undefined) formData.append("bold", options.bold);
  if (options?.italic !== undefined) formData.append("italic", options.italic);
  if (options?.watermarkImage) formData.append("watermarkImage", options.watermarkImage);

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
  redactions = [],
  redactText = null,
  pageNumbers = null
) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  
  // If redactions array is provided, stringify and send as redactAreas
  if (redactions && redactions.length > 0) {
    formData.append("redactAreas", JSON.stringify(redactions));
  }
  
  if (redactText) formData.append("redactText", redactText);
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

/**
 * Add page numbers to PDF
 * @param {File} pdfFile - PDF file
 * @param {Object} options - Configuration options
 * @returns {Promise<Blob>} - PDF with page numbers
 */
export const addPageNumbers = async (pdfFile, options = {}) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);
  
  if (options.position) formData.append("position", options.position);
  if (options.margin) formData.append("margin", options.margin);
  if (options.startPage !== undefined) formData.append("startPage", options.startPage);
  if (options.endPage !== undefined) formData.append("endPage", options.endPage);
  if (options.textContent) formData.append("textContent", options.textContent);
  if (options.fontFamily) formData.append("fontFamily", options.fontFamily);
  if (options.fontSize !== undefined) formData.append("fontSize", options.fontSize);
  if (options.bold !== undefined) formData.append("bold", options.bold);
  if (options.italic !== undefined) formData.append("italic", options.italic);
  if (options.underline !== undefined) formData.append("underline", options.underline);
  if (options.textColor) formData.append("textColor", options.textColor);
  if (options.pageMode) formData.append("pageMode", options.pageMode);

  return apiClient.post("/api/pdf/add-page-numbers", formData, {
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

/**
 * Sign PDF (text or image)
 * @param {File} pdfFile - PDF file
 * @param {{
 *  signatureText?: string,
 *  signatureImage?: string,
 *  pageNumber?: number,
 *  position?: string,
 *  x?: number,
 *  y?: number,
 *  fontSize?: number,
 *  color?: string,
 *  width?: number,
 *  height?: number
 * }} payload
 * @returns {Promise<Blob>} - Signed PDF
 */
export const signPdf = async (pdfFile, payload = {}) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  return apiClient.post("/api/pdf/sign", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Organize PDF (reorder or remove pages)
 * @param {File} pdfFile - PDF file
 * @param {{ pageOrder?: number[], pagesToRemove?: string }} payload
 * @returns {Promise<Blob>} - Organized PDF
 */
export const organizePdf = async (pdfFile, payload = {}) => {
  const formData = new FormData();
  formData.append("pdfFile", pdfFile);

  if (payload.pageOrder) {
    formData.append("pageOrder", JSON.stringify(payload.pageOrder));
  }
  if (payload.pagesToRemove) {
    formData.append("pagesToRemove", payload.pagesToRemove);
  }

  return apiClient.post("/api/pdf/organize", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    responseType: "blob",
  });
};

/**
 * Protect PDF with password
 * @param {File} file - PDF file to protect
 * @param {string} password - Password to encrypt the PDF
 * @returns {Promise<Blob>} - Protected PDF file
 */
export const lockDocument = async (file, password) => {
  console.log(`post data: ${file} ${password}`);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);

  return apiClient.post("/api/lockDocument", formData, {
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
