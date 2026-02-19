import React from "react";
import { convertToBlackWhite, getErrorMessage } from "../api";

export default function BlackWhitePanel({ file, loading, setLoading, setResult, setResultBlob }) {
  const handleBlackWhite = async () => {
    if (!file) {
      setResult({ success: false, error: "Please select an image file" });
      return;
    }

    setLoading(true);
    try {
      const response = await convertToBlackWhite(file); // file is actually imageFile in this context
      setResultBlob(response.data);
       setResult({ success: true, fileName: "black-white-images.zip" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Convert to Black & White</h3>
      
      {file && (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              This tool converts your image to grayscale (black and white).
              Great for reducing file size and creating classic looks.
            </p>
          </div>

          <button
            onClick={handleBlackWhite}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to Black & White"}
          </button>
        </>
      )}

      {!file && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload an image file above to convert</p>
        </div>
      )}
    </>
  );
}
