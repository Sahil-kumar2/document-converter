import React, { useState } from "react";
import { extractPdf, getErrorMessage } from "../api";

export default function ExtractPagesPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [pageNumbers, setPageNumbers] = useState("");

  const handleExtract = async () => {
    if (!pdfFile || !pageNumbers) {
      setResult({ success: false, error: "Please enter page numbers (e.g., 1,3,5-8)" });
      return;
    }

    setLoading(true);
    try {
      const response = await extractPdf(pdfFile, pageNumbers);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "extracted.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Extract Pages</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pages to Extract (e.g., 1,3,5-8)
            </label>
            <input
              type="text"
              value={pageNumbers}
              onChange={(e) => setPageNumbers(e.target.value)}
              placeholder="1,3,5-8"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <button
            onClick={handleExtract}
            disabled={loading || !pageNumbers.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Extracting..." : "Extract Pages"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to extract pages</p>
        </div>
      )}
    </>
  );
}
