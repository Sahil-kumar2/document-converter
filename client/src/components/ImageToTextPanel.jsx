import React from "react";
import { extractTextFromImage, getErrorMessage } from "../api";

export default function ImageToTextPanel({ file, loading, setLoading, setResult, setResultBlob }) {
  const handleExtractText = async () => {
    if (!file[0]) {
      setResult({ success: false, error: "Please select an image file" });
      return;
    }

    setLoading(true);
    try {
      const response = await extractTextFromImage(file[0]); // file[0] is actually imageFile in this context
      setResultBlob(response.data);
      setResult({ success: true, fileName: "extracted-text.txt" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Image to Text (OCR)</h3>
      
      {file[0] && (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              Optical Character Recognition (OCR) extracts text from images.
              Works best with clear, high-resolution images of text documents.
            </p>
          </div>

          <button
            onClick={handleExtractText}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Extracting Text..." : "Extract Text from Image"}
          </button>
        </>
      )}

      {!file[0] && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload an image file above to extract text</p>
        </div>
      )}
    </>
  );
}
