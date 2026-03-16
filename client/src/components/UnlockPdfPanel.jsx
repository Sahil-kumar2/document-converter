import React, { useState } from "react";
import { unlockPdf, getErrorMessage } from "../api";

export default function UnlockPdfPanel({
  pdfFile,
  loading,
  setLoading,
  setResult,
  setResultBlob,
}) {
  const [password, setPassword] = useState("");

  const handleUnlock = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please upload a PDF" });
      return;
    }

    if (!password) {
      setResult({ success: false, error: "Password is required" });
      return;
    }

    setLoading(true);

    try {
      const response = await unlockPdf(pdfFile, { password });
      setResultBlob(response.data);
      setResult({ success: true, fileName: "unlocked.pdf" });
    } catch (error) {
      setResult({
        success: false,
        error: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {pdfFile ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            🔓 Unlock PDF
          </h3>

          <input
            type="password"
            placeholder="Enter PDF password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />

          <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? "Unlocking..." : "🔓 Unlock PDF"}
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 p-8 rounded-lg text-center text-blue-800">
          <p className="text-lg font-medium">
            📄 Upload a PDF file to unlock
          </p>
        </div>
      )}
    </div>
  );
}
