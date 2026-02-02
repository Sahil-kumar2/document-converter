import React, { useState, useEffect } from "react";
import {
  splitPdf,
  extractPdf,
  rotatePdf,
  cropPdf,
  watermarkPdf,
  redactPdf,
  convertToPdfa,
  compressPdf,
  mergePdfs,
  removePages,
  repairPdf,
} from "../api";
import { getErrorMessage } from "../api";
import LoadingSpinner from "./LoadingSpinner";
import ResultPreview from "./ResultPreview";
import FileUpload from "./FileUpload";

/**
 * PdfToolsPanel Component
 * Advanced PDF manipulation tools in an expandable panel
 */
export default function PdfToolsPanel() {
  const [activeTab, setActiveTab] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);

  // Tool-specific states
  const [splitType, setSplitType] = useState("each");
  const [pageRanges, setPageRanges] = useState("");
  const [pageNumbers, setPageNumbers] = useState("");
  const [rotationAngle, setRotationAngle] = useState("90");
  const [watermarkText, setWatermarkText] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState("center");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [pdfaLevel, setPdfaLevel] = useState("PDF/A-2b");
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [mergePdfFiles, setMergePdfFiles] = useState([]);
  const [removePagesRange, setRemovePagesRange] = useState("");

  const addUniqueFiles = (prevFiles, newFiles) => {
    const map = new Map();
    prevFiles.forEach((file) => {
      map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
    });
    newFiles.forEach((file) => {
      map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (activeTab === "merge" && pdfFile) {
      setMergePdfFiles((prev) => addUniqueFiles(prev, [pdfFile]));
    }
  }, [activeTab, pdfFile]);

  const handlePdfSelect = (file) => {
    if (file.type === "application/pdf") {
      setPdfFile(file);
      setResult(null);
      setResultBlob(null);
    } else {
      setResult({
        success: false,
        error: "Please select a PDF file",
      });
    }
  };

  const downloadResult = () => {
    if (!resultBlob) return;
    const url = window.URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const resetResult = () => {
    setResult(null);
    setResultBlob(null);
    setPdfFile(null);
    setMergePdfFiles([]);
  };

  // Split PDF
  const handleSplit = async () => {
    if (!pdfFile) return;
    if (splitType === "range" && !pageRanges) {
      setResult({
        success: false,
        error: "Please enter page ranges (e.g., 1-3,5-7)",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await splitPdf(pdfFile, splitType, pageRanges || null);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "split.pdf",
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

  // Extract pages
  const handleExtract = async () => {
    if (!pdfFile || !pageNumbers) {
      setResult({
        success: false,
        error: "Please enter page numbers (e.g., 1,3,5-8)",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await extractPdf(pdfFile, pageNumbers);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "extracted.pdf",
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

  // Rotate pages
  const handleRotate = async () => {
    if (!pdfFile) return;

    setLoading(true);
    try {
      const response = await rotatePdf(pdfFile, parseInt(rotationAngle));
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "rotated.pdf",
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

  // Add watermark
  const handleWatermark = async () => {
    if (!pdfFile || !watermarkText) {
      setResult({
        success: false,
        error: "Please enter watermark text",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await watermarkPdf(
        pdfFile,
        watermarkText,
        watermarkPosition,
        watermarkOpacity,
        48
      );
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "watermarked.pdf",
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

  // Convert to PDF/A
  const handlePdfA = async () => {
    if (!pdfFile) return;

    setLoading(true);
    try {
      const response = await convertToPdfa(pdfFile, pdfaLevel);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: `archive_${pdfaLevel.replace("/", "_")}.pdf`,
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

  // Compress PDF
  const handleCompress = async () => {
    if (!pdfFile) return;

    setLoading(true);
    try {
      const response = await compressPdf(pdfFile, compressionLevel);
      const originalSize = response.headers["x-original-size"];
      const compressedSize = response.headers["x-compressed-size"];
      
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "compressed.pdf",
        metadata: {
          originalSize: originalSize ? parseInt(originalSize) : null,
          compressedSize: compressedSize ? parseInt(compressedSize) : null,
        },
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

  // Merge PDFs
  const handleMerge = async () => {
    if (mergePdfFiles.length < 2) {
      setResult({
        success: false,
        error: "Please select at least 2 PDF files to merge",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await mergePdfs(mergePdfFiles);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "merged.pdf",
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

  // Remove Pages
  const handleRemovePages = async () => {
    if (!pdfFile || !removePagesRange) {
      setResult({
        success: false,
        error: "Please enter page numbers to remove (e.g., 1,3,5-7)",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await removePages(pdfFile, removePagesRange);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "pages-removed.pdf",
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

  // Repair PDF
  const handleRepair = async () => {
    if (!pdfFile) return;

    setLoading(true);
    try {
      const response = await repairPdf(pdfFile);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "repaired.pdf",
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
      id: "compress",
      name: "Compress PDF",
      icon: "🗜️",
      description: "Reduce PDF file size",
    },
    {
      id: "merge",
      name: "Merge PDFs",
      icon: "🔗",
      description: "Combine multiple PDFs into one",
    },
    {
      id: "split",
      name: "Split PDF",
      icon: "✂️",
      description: "Split into individual pages or by ranges",
    },
    {
      id: "remove",
      name: "Remove Pages",
      icon: "🗑️",
      description: "Remove specific pages from PDF",
    },
    {
      id: "extract",
      name: "Extract Pages",
      icon: "📄",
      description: "Extract specific pages from PDF",
    },
    {
      id: "rotate",
      name: "Rotate Pages",
      icon: "🔄",
      description: "Rotate pages by 90, 180, or 270 degrees",
    },
    {
      id: "watermark",
      name: "Add Watermark",
      icon: "💧",
      description: "Add text watermark to PDF",
    },
    {
      id: "repair",
      name: "Repair PDF",
      icon: "🔧",
      description: "Fix corrupted PDF files",
    },
    {
      id: "pdfa",
      name: "PDF/A Archive",
      icon: "🗂️",
      description: "Convert to PDF/A for long-term archival",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <h2 className="text-2xl font-bold">🔧 PDF Tools</h2>
        <p className="text-purple-100 text-sm mt-1">
          Advanced PDF manipulation and analysis
        </p>
      </div>

      {/* Tool Selection Grid */}
      {!result && (
        <div className="p-6 space-y-6">
          {/* Upload Area */}
          {!pdfFile && activeTab !== "merge" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select PDF File:
              </label>
              <FileUpload
                onFileSelect={handlePdfSelect}
                acceptedTypes=".pdf"
                disabled={loading}
              />
                          <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                              or{" "}
                              <button
                                onClick={() => setActiveTab("merge")}
                                className="text-blue-600 hover:underline font-semibold"
                              >
                                Merge Multiple PDFs
                              </button>
                            </p>
                          </div>
            </div>
          )}

          {/* Show merge tool without file, or show other tools with file */}
          {(pdfFile || activeTab === "merge") && (
            <>
              {pdfFile && (
                <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Selected:</span> {pdfFile.name}{" "}
                  ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                </div>
              )}

              {/* Tool Tabs */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {tools.filter(tool => pdfFile || tool.id === "merge").map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTab(tool.id)}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      activeTab === tool.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
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
                  {activeTab === "compress" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Compress PDF
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Compression Level:
                        </label>
                        <select
                          value={compressionLevel}
                          onChange={(e) => setCompressionLevel(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="low">Low - Minimal compression</option>
                          <option value="medium">Medium - Balanced</option>
                          <option value="high">High - Maximum compression</option>
                        </select>
                      </div>
                      <p className="text-sm text-gray-600">
                        Reduce file size while maintaining quality.
                      </p>
                      <button
                        onClick={handleCompress}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Compress PDF"}
                      </button>
                    </>
                  )}

                  {activeTab === "merge" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Merge PDFs
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select PDF Files (in order):
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={(e) => {
                            const selected = Array.from(e.target.files || []);
                            if (selected.length > 0) {
                              setMergePdfFiles((prev) => addUniqueFiles(prev, selected));
                            }
                            e.target.value = "";
                          }}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      {mergePdfFiles.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Selected Files ({mergePdfFiles.length}):
                          </p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {mergePdfFiles.map((file, idx) => (
                              <li key={idx}>
                                {idx + 1}. {file.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        onClick={handleMerge}
                        disabled={loading || mergePdfFiles.length < 2}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : `Merge ${mergePdfFiles.length} PDFs`}
                      </button>
                    </>
                  )}

                  {activeTab === "remove" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Remove Pages
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pages to Remove (e.g., 1,3,5-7):
                        </label>
                        <input
                          type="text"
                          value={removePagesRange}
                          onChange={(e) => setRemovePagesRange(e.target.value)}
                          placeholder="1,3,5-7"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Specify page numbers to remove from the PDF.
                      </p>
                      <button
                        onClick={handleRemovePages}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Remove Pages"}
                      </button>
                    </>
                  )}

                  {activeTab === "repair" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Repair PDF
                      </h3>
                      <p className="text-sm text-gray-600">
                        Attempt to repair corrupted or damaged PDF files. This tool
                        will try to recover the content and structure of your PDF.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs text-yellow-800">
                          ⚠️ Note: Not all corrupted PDFs can be repaired. Severely
                          damaged files may not be recoverable.
                        </p>
                      </div>
                      <button
                        onClick={handleRepair}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Repair PDF"}
                      </button>
                    </>
                  )}

                  {activeTab === "split" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Split Options
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Split Type:
                        </label>
                        <select
                          value={splitType}
                          onChange={(e) => setSplitType(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="each">Split each page</option>
                          <option value="range">Split by range</option>
                        </select>
                      </div>
                      {splitType === "range" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Page Ranges (e.g., 1-3,5-7):
                          </label>
                          <input
                            type="text"
                            value={pageRanges}
                            onChange={(e) => setPageRanges(e.target.value)}
                            placeholder="1-3,5-7"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                      )}
                      <button
                        onClick={handleSplit}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Split PDF"}
                      </button>
                    </>
                  )}

                  {activeTab === "extract" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Extract Pages
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Page Numbers (e.g., 1,3,5-8):
                        </label>
                        <input
                          type="text"
                          value={pageNumbers}
                          onChange={(e) => setPageNumbers(e.target.value)}
                          placeholder="1,3,5-8"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <button
                        onClick={handleExtract}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Extract Pages"}
                      </button>
                    </>
                  )}

                  {activeTab === "rotate" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Rotate Pages
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rotation Angle:
                        </label>
                        <select
                          value={rotationAngle}
                          onChange={(e) => setRotationAngle(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="90">90 degrees</option>
                          <option value="180">180 degrees</option>
                          <option value="270">270 degrees</option>
                        </select>
                      </div>
                      <button
                        onClick={handleRotate}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Rotate PDF"}
                      </button>
                    </>
                  )}

                  {activeTab === "watermark" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        Add Watermark
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Watermark Text:
                        </label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g., CONFIDENTIAL"
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Position:
                          </label>
                          <select
                            value={watermarkPosition}
                            onChange={(e) => setWatermarkPosition(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="center">Center</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opacity: {watermarkOpacity.toFixed(2)}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={watermarkOpacity}
                            onChange={(e) =>
                              setWatermarkOpacity(parseFloat(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleWatermark}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Add Watermark"}
                      </button>
                    </>
                  )}

                  {activeTab === "pdfa" && (
                    <>
                      <h3 className="font-semibold text-gray-900">
                        PDF/A Archive Format
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          PDF/A Level:
                        </label>
                        <select
                          value={pdfaLevel}
                          onChange={(e) => setPdfaLevel(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="PDF/A-1b">PDF/A-1b</option>
                          <option value="PDF/A-2b">PDF/A-2b</option>
                          <option value="PDF/A-3b">PDF/A-3b</option>
                        </select>
                      </div>
                      <p className="text-sm text-gray-600">
                        Convert to PDF/A format for long-term archival and
                        compliance.
                      </p>
                      <button
                        onClick={handlePdfA}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Convert to PDF/A"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {loading && (
            <LoadingSpinner message="Processing your PDF..." />
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
            onDownload={downloadResult}
            onReset={resetResult}
          />
          
          {/* Compression Stats */}
          {result.success && result.metadata?.originalSize && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                📊 Compression Results
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Original Size:</p>
                  <p className="font-semibold text-gray-900">
                    {(result.metadata.originalSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Compressed Size:</p>
                  <p className="font-semibold text-green-700">
                    {(result.metadata.compressedSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Size Reduction:</p>
                  <p className="font-semibold text-green-700 text-lg">
                    {(
                      ((result.metadata.originalSize - result.metadata.compressedSize) /
                        result.metadata.originalSize) *
                      100
                    ).toFixed(1)}
                    % smaller
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
