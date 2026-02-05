import React from "react";
import { convertFile, getErrorMessage } from "../api";

export default function WebpToJpgPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const handleConvert = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a WebP file" });
      return;
    }

    setLoading(true);
    try {
      const response = await convertFile(pdfFile, "jpg");
      setResultBlob(response.data);
      setResult({ success: true, fileName: "converted.jpg" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">WebP to JPG</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              Convert WebP images to JPG format for wider compatibility.
            </p>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to JPG"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a WebP file above to convert to JPG</p>
        </div>
      )}
    </>
  );
}
