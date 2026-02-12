import React from "react";
import { convertFile, getErrorMessage } from "../api";

export default function WebpToPngPanel({
  files,
  loading,
  setLoading,
  setResult,
  setResultBlob
}) {

  const handleConvert = async () => {
    if (!files || files.length === 0) {
      setResult({ success: false, error: "Please select WebP file(s)" });
      return;
    }

    setLoading(true);

    try {
      const response = await convertFile(files, "png");

      setResultBlob(response.data);
      setResult({
        success: true,
        fileName:
          files.length > 1
            ? "converted-files.zip"
            : "converted.png"
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
        WebP to PNG
      </h3>

      {files && files.length > 0 ? (
        <>
          <div className="mb-4 bg-blue-50 p-4 rounded">
            <p className="text-sm text-blue-800">
              Convert WebP images to PNG format.
            </p>
            <p className="text-sm mt-2">
              {files.length} file(s) selected
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
          <p>Upload WebP file(s) above to convert to PNG</p>
        </div>
      )}
    </>
  );
}
