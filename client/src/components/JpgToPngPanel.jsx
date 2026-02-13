import React from "react";
import { convertFile, getErrorMessage } from "../api";

export default function JpgToPngPanel({
  file,
  loading,
  setLoading,
  setResult,
  setResultBlob
}) {

  const handleConvert = async () => {
    if (!file || file.length === 0) {
      setResult({ success: false, error: "Please select JPG file(s)" });
      return;
    }

    setLoading(true);

    try {
      const response = await convertFile(file, "png");

      setResultBlob(response.data);
      setResult({
        success: true,
        fileName:
          file.length > 1 ? "converted-files.zip" : "converted.png"
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
        JPG to PNG
      </h3>

      {file && file.length > 0 ? (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              Convert JPG/JPEG images to PNG format.
            </p>
            <p className="text-sm mt-2">
              {file.length} file(s) selected
            </p>
          </div>

          <button
            onClick={handleConvert}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert to PNG"}
          </button>
        </>
      ) : (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload JPG file(s) above to convert to PNG</p>
        </div>
      )}
    </>
  );
}
