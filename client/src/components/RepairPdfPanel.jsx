import React from "react";
import { repairPdf, getErrorMessage } from "../api";

export default function RepairPdfPanel({ file, loading, setLoading, setResult, setResultBlob }) {
  const handleRepair = async () => {
    if (!file[0]) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    setLoading(true);
    try {
      const response = await repairPdf(file[0]);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "repaired.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Repair PDF</h3>
      
      {file[0] && (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              This tool attempts to repair corrupted or damaged PDF files.
              It may not work for all types of corruption.
            </p>
          </div>

          <button
            onClick={handleRepair}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Repairing..." : "Repair PDF"}
          </button>
        </>
      )}

      {!file[0] && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a corrupted PDF file above to attempt repair</p>
        </div>
      )}
    </>
  );
}
