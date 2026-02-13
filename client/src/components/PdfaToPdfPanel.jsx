import React from "react";
import { convertToPdfa, getErrorMessage } from "../api";

export default function PdfaToPdfPanel({ file, loading, setLoading, setResult, setResultBlob }) {
  const handlePdfA = async () => {
    if (!file[0]) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    setLoading(true);
    try {
      const response = await convertToPdfa(file[0]);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "pdfa.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">PDF to PDF/A</h3>
      
      {file[0] && (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              PDF/A is an ISO-standardized version of PDF specialized for digital preservation.
              Great for archival and long-term document storage.
            </p>
          </div>

          <button
            onClick={handlePdfA}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to PDF/A"}
          </button>
        </>
      )}

      {!file[0] && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to convert to PDF/A</p>
        </div>
      )}
    </>
  );
}
