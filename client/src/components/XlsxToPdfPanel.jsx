import React from "react";
import { convertFile, getErrorMessage } from "../api";

export default function XlsxToPdfPanel({
  file: excelFile,
  loading,
  setLoading,
  setResult,
  setResultBlob
}) {

  const handleConvert = async () => {
    if (!excelFile) {
      setResult({ success: false, error: "Please select an Excel file" });
      return;
    }

    setLoading(true);
    try {
      const response = await convertFile(excelFile, "pdf");
      // If your backend uses different route, change "pdf" to "excel-to-pdf"

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
      <h3 className="font-semibold text-gray-900 mb-4">
        Excel to PDF
      </h3>

      {excelFile && (
        <>
          <div className="mb-4 bg-green-50 p-4 rounded">
            <p className="text-sm text-green-800">
              Convert Microsoft Excel (.xls, .xlsx) files to PDF format.
            </p>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to PDF"}
          </button>
        </>
      )}

      {!excelFile && (
        <div className="bg-green-50 p-4 rounded text-center text-green-800">
          <p>Upload an Excel file above to convert to PDF</p>
        </div>
      )}
    </>
  );
}
