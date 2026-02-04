import React, { useState } from "react";
import { splitPdf, getErrorMessage } from "../api";

export default function SplitPdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [splitType, setSplitType] = useState("pages"); // "pages" or "range"
  const [pageRanges, setPageRanges] = useState("");

  const handleSplit = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }
    if (splitType === "range" && !pageRanges) {
      setResult({ success: false, error: "Please enter page ranges (e.g., 1-3,5-7)" });
      return;
    }

    setLoading(true);
    try {
      const response = await splitPdf(pdfFile, splitType, pageRanges || null);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "split.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Split PDF</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Split Mode</label>
            <select
              value={splitType}
              onChange={(e) => setSplitType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="pages">Split into individual pages</option>
              <option value="range">Split by custom ranges</option>
            </select>
          </div>

          {splitType === "range" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Ranges (e.g., 1-3,5-7)
              </label>
              <input
                type="text"
                value={pageRanges}
                onChange={(e) => setPageRanges(e.target.value)}
                placeholder="1-3,5-7"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          )}

          <button
            onClick={handleSplit}
            disabled={loading || (splitType === "range" && !pageRanges)}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Splitting..." : "Split PDF"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to split</p>
        </div>
      )}
    </>
  );
}
