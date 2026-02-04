import React, { useState } from "react";
import { watermarkPdf, getErrorMessage } from "../api";

export default function WatermarkPdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState("center");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);

  const handleWatermark = async () => {
    if (!pdfFile || !watermarkText) {
      setResult({ success: false, error: "Please enter watermark text" });
      return;
    }

    setLoading(true);
    try {
      const response = await watermarkPdf(
        pdfFile,
        watermarkText,
        watermarkPosition,
        watermarkOpacity,
        48
      );
      setResultBlob(response.data);
      setResult({ success: true, fileName: "watermarked.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Watermark PDF</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Watermark Text</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="CONFIDENTIAL"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <select
              value={watermarkPosition}
              onChange={(e) => setWatermarkPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="center">Center</option>
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity: {watermarkOpacity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleWatermark}
            disabled={loading || !watermarkText.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Add Watermark"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to add watermark</p>
        </div>
      )}
    </>
  );
}
