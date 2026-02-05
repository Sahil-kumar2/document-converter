import React from "react";
import { convertFile, getErrorMessage } from "../api";

export default function JpgToPdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const handleConvert = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a JPG file" });
      return;
    }

    setLoading(true);
    try {
      const response = await convertFile(pdfFile, "pdf");
      setResultBlob(response.data);
      setResult({ success: true, fileName: "converted.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">JPG to PDF</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              Convert JPG/JPEG images to PDF format. Perfect for creating
              PDF documents from images.
            </p>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to PDF"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a JPG file above to convert to PDF</p>
        </div>
      )}
    </>
  );
}
