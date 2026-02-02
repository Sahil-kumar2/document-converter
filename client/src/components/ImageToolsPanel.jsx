import React, { useState } from "react";
import {
  convertToBlackWhite,
  extractTextFromImage,
  convertFile,
  getErrorMessage,
} from "../api";
import LoadingSpinner from "./LoadingSpinner";
import ResultPreview from "./ResultPreview";
import FileUpload from "./FileUpload";

/**
 * ImageToolsPanel Component
 * Image processing and conversion tools
 */
export default function ImageToolsPanel() {
  const [activeTab, setActiveTab] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [convertTo, setConvertTo] = useState("png");

  const handleImageSelect = (file) => {
    if (file.type.startsWith("image/")) {
      setImageFile(file);
      setResult(null);
      setResultData(null);
    } else {
      setResult({
        success: false,
        error: "Please select an image file",
      });
    }
  };

  const downloadResult = (data, fileName, mimeType) => {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const resetResult = () => {
    setResult(null);
    setResultData(null);
    setImageFile(null);
    setActiveTab(null);
  };

  // Convert to black & white
  const handleBlackWhite = async () => {
    if (!imageFile) return;

    setLoading(true);
    try {
      const response = await convertToBlackWhite(imageFile);
      // Backend now returns blob
      setResultData({
        type: "blob",
        blob: response.data,
        fileName: "black-white.jpg",
      });
      setResult({
        success: true,
        fileName: "black-white.jpg",
      });
    } catch (error) {
      setResult({
        success: false,
        error: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Extract text from image (OCR)
  const handleExtractText = async () => {
    if (!imageFile) return;

    setLoading(true);
    try {
      const response = await extractTextFromImage(imageFile);
      // Backend now returns text file as blob
      setResultData({
        type: "blob",
        blob: response.data,
        fileName: "extracted-text.txt",
      });
      setResult({
        success: true,
        fileName: "extracted-text.txt",
      });
    } catch (error) {
      setResult({
        success: false,
        error: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Convert image format
  const handleConvertImage = async () => {
    if (!imageFile) return;

    setLoading(true);
    try {
      const response = await convertFile(imageFile, convertTo);
      setResultData({
        type: "blob",
        blob: response.data,
        fileName: `converted.${convertTo}`,
      });
      setResult({
        success: true,
        fileName: `converted.${convertTo}`,
      });
    } catch (error) {
      setResult({
        success: false,
        error: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    {
      id: "black-white",
      name: "Black & White",
      icon: "⚫",
      description: "Convert to grayscale",
    },
    {
      id: "extract-text",
      name: "Extract Text",
      icon: "📝",
      description: "OCR - Extract text from image",
    },
    {
      id: "convert",
      name: "Format Conversion",
      icon: "🔄",
      description: "Convert between PNG/JPG/WebP",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
        <h2 className="text-2xl font-bold">🖼️ Image Tools</h2>
        <p className="text-green-100 text-sm mt-1">
          Image processing and extraction
        </p>
      </div>

      {!result && (
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!imageFile && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Image File:
              </label>
              <FileUpload
                onFileSelect={handleImageSelect}
                acceptedTypes="image/*"
                disabled={loading}
              />
            </div>
          )}

          {/* File Selected - Show Tools */}
          {imageFile && (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Selected:</span> {imageFile.name}{" "}
                  ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>

              {/* Tool Selection Grid */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      activeTab === tool.id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 bg-white hover:border-green-300"
                    }`}
                    disabled={loading}
                  >
                    <div className="text-2xl">{tool.icon}</div>
                    <h3 className="font-semibold text-sm mt-1">{tool.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {tool.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Tool Options Panel */}
              {activeTab && (
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  {activeTab === "black-white" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Convert to Black & White
                      </h3>
                      <p className="text-sm text-gray-600">
                        Convert your image to grayscale format.
                      </p>
                      <button
                        onClick={handleBlackWhite}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Convert"}
                      </button>
                    </>
                  )}

                  {activeTab === "extract-text" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Extract Text from Image
                      </h3>
                      <p className="text-sm text-gray-600">
                        Use OCR technology to extract text from your image.
                      </p>
                      <button
                        onClick={handleExtractText}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Extract Text"}
                      </button>
                    </>
                  )}

                  {activeTab === "convert" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Convert Image Format
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Convert to:
                        </label>
                        <select
                          value={convertTo}
                          onChange={(e) => setConvertTo(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="png">PNG</option>
                          <option value="jpg">JPG</option>
                        </select>
                      </div>
                      <button
                        onClick={handleConvertImage}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Convert Image"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {loading && (
            <LoadingSpinner message="Processing your image..." />
          )}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="p-6">
          <ResultPreview
            success={result.success}
            error={result.error}
            fileName={result.fileName}
            onDownload={() => {
              if (resultData?.type === "blob") {
                // Handle blob download for all image operations
                const url = window.URL.createObjectURL(resultData.blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = resultData.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }
            }}
            onReset={resetResult}
          />
        </div>
      )}
    </div>
  );
}
