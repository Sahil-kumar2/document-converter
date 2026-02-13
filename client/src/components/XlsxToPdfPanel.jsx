import React from "react";
import { convertFile, getErrorMessage } from "../api";

export default function XlsxToPdfPanel({
  file,
  loading,
  setLoading,
  setResult,
  setResultBlob
}) {

  const handleConvert = async () => {
    if (!file || file.length === 0) {
      setResult({ success: false, error: "Please select Excel file(s)" });
      return;
    }

    setLoading(true);

    try {
      const response = await convertFile(file, "pdf");

      setResultBlob(response.data);

      setResult({
        success: true,
        fileName:
          file.length > 1
            ? "converted-files.zip"
            : "converted.pdf"
      });

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

      {file && file.length > 0 ? (
        <>
          <div className="mb-4 bg-green-50 p-4 rounded">
            <p className="text-sm text-green-800">
              Convert Microsoft Excel (.xls, .xlsx) file to PDF format.
            </p>
            <p className="text-sm mt-2">
              {file.length} file(s) selected
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
      ) : (
        <div className="bg-green-50 p-4 rounded text-center text-green-800">
          <p>Upload Excel file(s) above to convert to PDF</p>
        </div>
      )}
    </>
  );
}
