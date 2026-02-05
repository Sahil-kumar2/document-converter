import React, { useState } from "react";
import { compressPdf, getErrorMessage } from "../api";

export default function CompressPdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [compressionLevel, setCompressionLevel] = useState("medium");

  const handleCompress = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    setLoading(true);
    try {
      const response = await compressPdf(pdfFile, compressionLevel);
      const originalSize = response.headers["x-original-size"];
      const compressedSize = response.headers["x-compressed-size"];
      
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "compressed.pdf",
        metadata: {
          originalSize: originalSize ? parseInt(originalSize) : null,
          compressedSize: compressedSize ? parseInt(compressedSize) : null,
        },
      });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Compress PDF</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Compression Level</label>
            <select
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="low">Low (larger file, better quality)</option>
              <option value="medium">Medium (balanced)</option>
              <option value="high">High (smaller file, lower quality)</option>
            </select>
          </div>

          <button
            onClick={handleCompress}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Compressing..." : "Compress PDF"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to compress</p>
        </div>
      )}
    </>
  );
}
