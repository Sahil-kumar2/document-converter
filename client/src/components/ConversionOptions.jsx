import React from "react";

/**
 * ConversionOptions Component
 * Displays available conversion options based on file type
 */
export default function ConversionOptions({
  file,
  selectedFormat,
  onFormatChange,
  disabled = false,
}) {
  const getFileExtension = (filename) =>
    filename.split(".").pop().toLowerCase();

  const conversionRules = {
    pdf: ["docx", "xlsx", "png", "jpg", "html", "ppt"],
    html: ["pdf"],
    docx: ["pdf"],
    xlsx: ["pdf"],
    ppt: ["pdf"],
    pptx: ["pdf"],
    jpg: ["png"],
    jpeg: ["png"],
    png: ["jpg"],
    webp: ["jpg", "png"],
  };

  if (!file) return null;

  const ext = getFileExtension(file.name);
  const options = conversionRules[ext] || [];

  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Convert to:
        </label>
        <select
          value={selectedFormat}
          onChange={(e) => onFormatChange(e.target.value)}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p>
          <span className="font-semibold">File:</span> {file.name}
        </p>
        <p>
          <span className="font-semibold">Size:</span>{" "}
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
}
