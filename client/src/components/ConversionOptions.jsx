import React from "react";

/**
 * ConversionOptions Component
 * Displays available conversion options based on file type
 */
export default function ConversionOptions({
  files,
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
    jpg: ["png", "pdf"],
    jpeg: ["png", "pdf"],
    png: ["jpg", "pdf"],
    webp: ["jpg", "png"],
  };

  if (!files || files.length === 0) return null;

  // Use first file to determine conversion options
  const ext = getFileExtension(files[0].name);
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

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg space-y-1">
        <p className="font-semibold">Selected Files:</p>
        {files.map((file, index) => (
          <div key={index}>
            {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        ))}
      </div>
    </div>
  );
}
