export const FILE_SIZE_LIMITS = {
  pdf: 100 * 1024 * 1024, // 100MB
  image: 20 * 1024 * 1024, // 20MB
  document: 50 * 1024 * 1024, // 50MB
  excel: 10 * 1024 * 1024, // 10MB
};

export const getFileCategory = (file) => {
  const name = file?.name || "";
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  const mime = (file?.type || "").toLowerCase();

  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (["jpg", "jpeg", "png", "webp"].includes(ext) || mime.startsWith("image/")) return "image";
  if (ext === "xlsx") return "excel";
  if (["docx", "pptx", "html"].includes(ext)) return "document";

  return "document";
};

export const getFileSizeLimit = (file) => {
  const category = getFileCategory(file);
  return FILE_SIZE_LIMITS[category] ?? FILE_SIZE_LIMITS.document;
};

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < sizes.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export const validateFileSize = (file) => {
  const limit = getFileSizeLimit(file);
  if (!file) return { valid: false, limit, category: "document" };
  return {
    valid: file.size <= limit,
    limit,
    category: getFileCategory(file),
  };
};
