import React from "react";

/**
 * ResultPreview Component
 * Displays success/error messages and download button
 */
export default function ResultPreview({
  success,
  error,
  fileName,
  onDownload,
  onReset,
}) {
  const handleShare = () => {
    alert("Share feature coming soon! 🚀");
  };
  if (!success && !error) return null;

  return (
    <div
      className={`rounded-xl p-6 space-y-4 ${
        success
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{success ? "✅" : "❌"}</span>
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${
            success ? "text-green-900" : "text-red-900"
          }`}>
            {success ? "Conversion Successful!" : "Conversion Failed"}
          </h3>
          <p className={`text-sm mt-1 ${
            success ? "text-green-700" : "text-red-700"
          }`}>
            {success ? `File ready: ${fileName}` : error}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        {success && (
          <>
            <button
              onClick={onDownload}
              className="flex-1 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              ⬇️ Download File
            </button>
            <button
              onClick={handleShare}
              title="Share feature coming soon"
              className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              📤 Share
            </button>
          </>
        )}
        <button
          onClick={onReset}
          className={`flex-1 ${
            success
              ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
              : "bg-red-200 text-red-900 hover:bg-red-300"
          } px-6 py-2 rounded-lg font-semibold transition`}
        >
          {success ? "Convert Another" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
