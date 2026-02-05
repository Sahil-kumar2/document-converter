import React, { useState } from "react";
import { rotatePdf, getErrorMessage } from "../api";

export default function RotatePdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [rotationAngle, setRotationAngle] = useState("90");

  const handleRotate = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    setLoading(true);
    try {
      const response = await rotatePdf(pdfFile, parseInt(rotationAngle));
      setResultBlob(response.data);
      setResult({ success: true, fileName: "rotated.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Rotate PDF</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rotation Angle</label>
            <select
              value={rotationAngle}
              onChange={(e) => setRotationAngle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="90">90° Clockwise</option>
              <option value="180">180°</option>
              <option value="270">270° Clockwise (90° Counter-clockwise)</option>
            </select>
          </div>

          <button
            onClick={handleRotate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Rotating..." : "Rotate PDF"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to rotate</p>
        </div>
      )}
    </>
  );
}
