import React, { useState } from "react";
import { signPdf, getErrorMessage } from "../api";

export default function SignPdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [signatureImage, setSignatureImage] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState("bottom-right");
  const [signatureSize, setSignatureSize] = useState("medium");
  const [signaturePageNumber, setSignaturePageNumber] = useState(1);
  const [applyToAllPages, setApplyToAllPages] = useState(false);

  const handleSignatureImageSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSignatureImage(file);
    } else {
      setResult({ success: false, error: "Please select an image file" });
    }
  };

  const handleSign = async () => {
    if (!pdfFile || !signatureImage) {
      setResult({ success: false, error: "Please select PDF and signature image" });
      return;
    }

    setLoading(true);
    try {
      const response = await signPdf(pdfFile, {
        signatureImage: signatureImage,
        position: signaturePosition,
        pageNumber: applyToAllPages ? undefined : signaturePageNumber,
        applyToAllPages: applyToAllPages
      });
      setResultBlob(response.data);
      setResult({ success: true, fileName: "signed.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Sign PDF</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Signature Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleSignatureImageSelect(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {signatureImage && (
              <p className="text-sm text-green-600 mt-1">✓ {signatureImage.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <select
              value={signaturePosition}
              onChange={(e) => setSignaturePosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
              <option value="center">Center</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
            <select
              value={signatureSize}
              onChange={(e) => setSignatureSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="allPages"
              checked={applyToAllPages}
              onChange={(e) => setApplyToAllPages(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="allPages" className="text-sm text-gray-700">Apply to all pages</label>
          </div>

          {!applyToAllPages && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Page Number</label>
              <input
                type="number"
                min="1"
                value={signaturePageNumber}
                onChange={(e) => setSignaturePageNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          )}

          <button
            onClick={handleSign}
            disabled={loading || !signatureImage}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Sign PDF"}
          </button>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to add signature</p>
        </div>
      )}
    </>
  );
}
