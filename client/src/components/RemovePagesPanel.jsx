import React, { useState } from "react";
import { removePages, getErrorMessage } from "../api";

export default function RemovePagesPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [removePagesRange, setRemovePagesRange] = useState("");

  const handleRemovePages = async () => {
    if (!pdfFile || !removePagesRange) {
      setResult({ success: false, error: "Please enter page numbers to remove (e.g., 1,3,5-7)" });
      return;
    }

    setLoading(true);
    try {
      const response = await removePages(pdfFile, removePagesRange);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "pages-removed.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Remove Pages</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pages to Remove (e.g., 1,3,5-7)
            </label>
            <input
              type="text"
              value={removePagesRange}
              onChange={(e) => setRemovePagesRange(e.target.value)}
              placeholder="1,3,5-7"
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>

          <button
            onClick={handleRemovePages}
            disabled={loading || !removePagesRange.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Remove Pages"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to remove pages</p>
        </div>
      )}
    </>
  );
}
