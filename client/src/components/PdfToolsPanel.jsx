import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
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
  signPdf,
  organizePdf,
} from "../api";
import { getErrorMessage } from "../api";
import LoadingSpinner from "./LoadingSpinner";
import ResultPreview from "./ResultPreview";
import FileUpload from "./FileUpload";
import CropPdfPanel from "./CropPdfPanel";

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
  const [signatureMode, setSignatureMode] = useState("text");
  const [signatureText, setSignatureText] = useState("");
  const [signatureImageData, setSignatureImageData] = useState("");
  const [signaturePage, setSignaturePage] = useState(1);
  const [signaturePosition, setSignaturePosition] = useState("bottom-right");
  const [signatureX, setSignatureX] = useState("");
  const [signatureY, setSignatureY] = useState("");
  const [signatureFontSize, setSignatureFontSize] = useState(24);
  const [signatureColor, setSignatureColor] = useState("#000000");
  const [signatureWidth, setSignatureWidth] = useState(150);
  const [signatureHeight, setSignatureHeight] = useState(50);
  const [organizeMode, setOrganizeMode] = useState("reorder");
  const [totalPages, setTotalPages] = useState(0);
  const [organizePages, setOrganizePages] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  
  // Redaction state
  const [redactions, setRedactions] = useState([]);
  const [isDrawingRedaction, setIsDrawingRedaction] = useState(false);
  const [redactionStartPoint, setRedactionStartPoint] = useState(null);
  const [currentDrawingPoint, setCurrentDrawingPoint] = useState(null);
  
  // Crop state
  const [cropMode, setCropMode] = useState("all_pages");
  const [cropPageNumber, setCropPageNumber] = useState(1);
  const [cropBox, setCropBox] = useState(null); // { x, y, width, height }
  const [isDrawingCrop, setIsDrawingCrop] = useState(false);
  const [cropStartPoint, setCropStartPoint] = useState(null);

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

  useEffect(() => {
    if (Number.isInteger(totalPages) && totalPages > 0) {
      setOrganizePages(Array.from({ length: totalPages }, (_, i) => i + 1));
    } else {
      setOrganizePages([]);
    }
  }, [totalPages]);

  useEffect(() => {
    const loadPageCount = async () => {
      if (!pdfFile) {
        setTotalPages(0);
        return;
      }
      try {
        const buffer = await pdfFile.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        setTotalPages(doc.getPageCount());
      } catch {
        setTotalPages(0);
      }
    };
    loadPageCount();
  }, [pdfFile]);

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

  // Crop PDF handler
  const handleCrop = async () => {
    if (!pdfFile) {
      setResult({
        success: false,
        error: "Please select a PDF file",
      });
      return;
    }

    if (!cropBox) {
      setResult({
        success: false,
        error: "Please draw a crop area on the PDF",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await cropPdf(
        pdfFile,
        cropBox.x,
        cropBox.y,
        cropBox.width,
        cropBox.height,
        cropMode,
        cropPageNumber
      );
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "cropped.pdf",
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

  // Crop drawing handlers
  const handleCropMouseDown = (e) => {
    if (activeTab !== "crop") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStartPoint({ x, y });
    setIsDrawingCrop(true);
  };

  const handleCropMouseMove = (e) => {
    if (!isDrawingCrop || !cropStartPoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const x = Math.min(cropStartPoint.x, currentX);
    const y = Math.min(cropStartPoint.y, currentY);
    const width = Math.abs(currentX - cropStartPoint.x);
    const height = Math.abs(currentY - cropStartPoint.y);
    
    setCropBox({ x, y, width, height });
  };

  const handleCropMouseUp = () => {
    setIsDrawingCrop(false);
  };

  const handleResetCrop = () => {
    setCropBox(null);
    setCropStartPoint(null);
    setIsDrawingCrop(false);
  };

  // Redaction drawing handlers
  const handleRedactionMouseDown = (e) => {
    if (activeTab !== "redact") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRedactionStartPoint({ x, y });
    setIsDrawingRedaction(true);
    setCurrentDrawingPoint(null);
  };

  const handleRedactionMouseMove = (e) => {
    if (!isDrawingRedaction || !redactionStartPoint) {
      setCurrentDrawingPoint(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;
    setCurrentDrawingPoint({ x: currentX, y: currentY });
  };

  const handleRedactionMouseUp = (e) => {
    if (!isDrawingRedaction || !redactionStartPoint) {
      setIsDrawingRedaction(false);
      setCurrentDrawingPoint(null);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / rect.width;
    const endY = (e.clientY - rect.top) / rect.height;

    // Calculate position and size
    const xRatio = Math.min(redactionStartPoint.x, endX);
    const yRatio = Math.min(redactionStartPoint.y, endY);
    const widthRatio = Math.abs(endX - redactionStartPoint.x);
    const heightRatio = Math.abs(endY - redactionStartPoint.y);

    // Only add if box is large enough (at least 1% of page size)
    if (widthRatio > 0.01 && heightRatio > 0.01) {
      const newRedaction = {
        pageIndex: 0,
        xRatio: Math.round(xRatio * 10000) / 10000,
        yRatio: Math.round(yRatio * 10000) / 10000,
        widthRatio: Math.round(widthRatio * 10000) / 10000,
        heightRatio: Math.round(heightRatio * 10000) / 10000,
      };
      setRedactions([...redactions, newRedaction]);
      console.log('Added redaction:', newRedaction);
    }

    setIsDrawingRedaction(false);
    setRedactionStartPoint(null);
    setCurrentDrawingPoint(null);
  };

  const handleClearRedactions = () => {
    setRedactions([]);
  };

  // Redact PDF
  const handleRedact = async () => {
    if (!pdfFile) {
      setResult({
        success: false,
        error: "Please select a PDF file",
      });
      return;
    }

    if (!redactions || redactions.length === 0) {
      setResult({
        success: false,
        error: "Please draw at least one redaction box",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await redactPdf(pdfFile, redactions);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "redacted.pdf",
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

  const handleSignatureImageSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureImageData(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleSign = async () => {
    if (!pdfFile) return;
    if (signatureMode === "text" && !signatureText.trim()) {
      setResult({
        success: false,
        error: "Please enter signature text",
      });
      return;
    }
    if (signatureMode === "image" && !signatureImageData) {
      setResult({
        success: false,
        error: "Please upload a signature image",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        signatureText: signatureMode === "text" ? signatureText : undefined,
        signatureImage: signatureMode === "image" ? signatureImageData : undefined,
        pageNumber: signaturePage,
        position: signaturePosition,
        x: signatureX !== "" ? Number(signatureX) : undefined,
        y: signatureY !== "" ? Number(signatureY) : undefined,
        fontSize: signatureMode === "text" ? signatureFontSize : undefined,
        color: signatureMode === "text" ? signatureColor : undefined,
        width: signatureMode === "image" ? signatureWidth : undefined,
        height: signatureMode === "image" ? signatureHeight : undefined,
      };

      const response = await signPdf(pdfFile, payload);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "signed.pdf",
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

  const handleOrganizeReorder = async () => {
    if (!pdfFile) return;
    if (organizePages.length === 0) {
      setResult({
        success: false,
        error: "Please enter total pages and reorder the list",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await organizePdf(pdfFile, { pageOrder: organizePages });
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "organized.pdf",
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

  const handleOrganizeRemove = async () => {
    if (!pdfFile) return;
    if (!pagesToRemoveInput.trim()) {
      setResult({
        success: false,
        error: "Please enter pages to remove (e.g., 1,3,5-7)",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await organizePdf(pdfFile, { pagesToRemove: pagesToRemoveInput.trim() });
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "organized.pdf",
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

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...organizePages];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setOrganizePages(updated);
    setDragIndex(null);
  };

  const tools = [
    {
      id: "sign",
      name: "Sign PDF",
      icon: "✍️",
      description: "Add signature to PDF pages",
    },
    {
      id: "organize",
      name: "Organize PDF",
      icon: "🧩",
      description: "Reorder or remove pages",
    },
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
      id: "crop",
      name: "Crop PDF",
      icon: "✂️",
      description: "Crop pages to selected area",
    },
    {
      id: "watermark",
      name: "Add Watermark",
      icon: "💧",
      description: "Add text watermark to PDF",
    },
    {
      id: "redact",
      name: "Redact PDF",
      icon: "🖍️",
      description: "Draw black boxes to permanently hide content",
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
                  {activeTab === "sign" && (
                    <>
                      <h3 className="font-semibold text-gray-900">Sign PDF</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Page Number:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={signaturePage}
                            onChange={(e) => setSignaturePage(parseInt(e.target.value || "1", 10))}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Position:
                          </label>
                          <select
                            value={signaturePosition}
                            onChange={(e) => setSignaturePosition(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Center</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            X (optional):
                          </label>
                          <input
                            type="number"
                            value={signatureX}
                            onChange={(e) => setSignatureX(e.target.value)}
                            placeholder="Auto"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Y (optional):
                          </label>
                          <input
                            type="number"
                            value={signatureY}
                            onChange={(e) => setSignatureY(e.target.value)}
                            placeholder="Auto"
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setSignatureMode("text")}
                          className={`flex-1 px-4 py-2 rounded font-semibold border ${
                            signatureMode === "text"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          Text Signature
                        </button>
                        <button
                          onClick={() => setSignatureMode("image")}
                          className={`flex-1 px-4 py-2 rounded font-semibold border ${
                            signatureMode === "image"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          Image Signature
                        </button>
                      </div>

                      {signatureMode === "text" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Signature Text:
                            </label>
                            <input
                              type="text"
                              value={signatureText}
                              onChange={(e) => setSignatureText(e.target.value)}
                              placeholder="e.g., John Doe"
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Font Size:
                              </label>
                              <input
                                type="number"
                                min="8"
                                value={signatureFontSize}
                                onChange={(e) => setSignatureFontSize(parseInt(e.target.value || "24", 10))}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color:
                              </label>
                              <input
                                type="color"
                                value={signatureColor}
                                onChange={(e) => setSignatureColor(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 h-10"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {signatureMode === "image" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upload Signature Image:
                            </label>
                            <FileUpload
                              onFileSelect={handleSignatureImageSelect}
                              acceptedTypes="image/*"
                              disabled={loading}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Width (px):
                              </label>
                              <input
                                type="number"
                                min="10"
                                value={signatureWidth}
                                onChange={(e) => setSignatureWidth(parseInt(e.target.value || "150", 10))}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Height (px):
                              </label>
                              <input
                                type="number"
                                min="10"
                                value={signatureHeight}
                                onChange={(e) => setSignatureHeight(parseInt(e.target.value || "50", 10))}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                              />
                            </div>
                          </div>
                          {signatureImageData && (
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-2">Preview:</p>
                              <img
                                src={signatureImageData}
                                alt="Signature preview"
                                className="max-h-24 object-contain"
                              />
                            </div>
                          )}
                        </>
                      )}

                      <button
                        onClick={handleSign}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? "Processing..." : "Sign PDF"}
                      </button>
                    </>
                  )}

                  {activeTab === "organize" && (
                    <>
                      <h3 className="font-semibold text-gray-900">Organize PDF</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setOrganizeMode("reorder")}
                          className={`flex-1 px-4 py-2 rounded font-semibold border ${
                            organizeMode === "reorder"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          Reorder Pages
                        </button>
                        <button
                          onClick={() => setOrganizeMode("remove")}
                          className={`flex-1 px-4 py-2 rounded font-semibold border ${
                            organizeMode === "remove"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          Remove Pages
                        </button>
                      </div>

                      {organizeMode === "reorder" && (
                        <>
                          {totalPages > 0 && (
                            <div className="text-sm text-gray-600">
                              Total pages detected: <span className="font-semibold">{totalPages}</span>
                            </div>
                          )}
                          {organizePages.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-sm text-gray-700 mb-2">Drag to reorder pages:</p>
                              <ul className="space-y-2">
                                {organizePages.map((page, idx) => (
                                  <li
                                    key={`${page}-${idx}`}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => handleDrop(idx)}
                                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2 cursor-move"
                                  >
                                    <span className="text-sm font-semibold">Page {page}</span>
                                    <button
                                      onClick={() => setOrganizePages(organizePages.filter((_, i) => i !== idx))}
                                      className="text-xs text-red-600 hover:underline"
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <button
                            onClick={handleOrganizeReorder}
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                          >
                            {loading ? "Processing..." : "Apply Reorder"}
                          </button>
                        </>
                      )}

                      {organizeMode === "remove" && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pages to Remove (e.g., 1,3,5-7):
                            </label>
                            <input
                              type="text"
                              value={pagesToRemoveInput}
                              onChange={(e) => setPagesToRemoveInput(e.target.value)}
                              placeholder="1,3,5-7"
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                          </div>
                          <button
                            onClick={handleOrganizeRemove}
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                          >
                            {loading ? "Processing..." : "Remove Pages"}
                          </button>
                        </>
                      )}
                    </>
                  )}
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

                  {activeTab === "redact" && (
                    <>
                      <h3 className="font-semibold text-gray-900 mb-4">
                        Redact PDF - Draw Black Boxes
                      </h3>
                      
                      {pdfFile && (
                        <>
                          {/* PDF Preview Area */}
                          <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 relative overflow-auto" style={{ minHeight: "400px", maxHeight: "500px" }}>
                            <canvas
                              ref={(el) => {
                                if (el && pdfFile) {
                                  // Render PDF to canvas
                                  const reader = new FileReader();
                                  reader.onload = async (e) => {
                                    try {
                                      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
                                      GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                                      
                                      const pdf = await getDocument({ data: e.target.result }).promise;
                                      const page = await pdf.getPage(1);
                                      const viewport = page.getViewport({ scale: 1.5 });
                                      
                                      el.width = viewport.width;
                                      el.height = viewport.height;
                                      
                                      const ctx = el.getContext('2d');
                                      const renderContext = {
                                        canvasContext: ctx,
                                        viewport: viewport,
                                      };
                                      
                                      await page.render(renderContext).promise;
                                    } catch (err) {
                                      console.error('Error rendering PDF:', err);
                                      const ctx = el.getContext('2d');
                                      ctx.fillStyle = '#f3f4f6';
                                      ctx.fillRect(0, 0, el.width, el.height);
                                      ctx.fillStyle = '#c00';
                                      ctx.font = '14px Arial';
                                      ctx.textAlign = 'center';
                                      ctx.fillText('Error rendering PDF', el.width / 2, el.height / 2);
                                    }
                                  };
                                  reader.readAsArrayBuffer(pdfFile);
                                }
                              }}
                              onMouseDown={handleRedactionMouseDown}
                              onMouseUp={handleRedactionMouseUp}
                              className="cursor-crosshair block"
                              style={{ minHeight: "400px", maxWidth: "100%", height: "auto" }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                              <strong>How to use:</strong>
                              <ul className="mt-2 space-y-1">
                                <li>• Click and drag on the PDF</li>
                                <li>• Release to create box</li>
                                <li>• Multiple boxes OK</li>
                              </ul>
                            </div>
                            <div className="bg-gray-100 p-3 rounded text-sm">
                              <strong>Redactions:</strong>
                              <p className="mt-2 text-2xl font-bold text-red-600">{redactions.length}</p>
                              {redactions.length > 0 && (
                                <button
                                  onClick={handleClearRedactions}
                                  className="mt-2 text-red-600 hover:underline text-sm"
                                >
                                  Clear All
                                </button>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={handleRedact}
                            disabled={loading || redactions.length === 0}
                            className="w-full bg-red-600 text-white py-3 rounded font-semibold hover:bg-red-700 disabled:opacity-50 mb-3"
                          >
                            {loading ? "Processing..." : `Redact PDF (${redactions.length} box${redactions.length !== 1 ? 'es' : ''})`}
                          </button>
                          
                          <div className="bg-yellow-50 border border-yellow-300 p-3 rounded text-sm text-yellow-800">
                            <strong>⚠️ Warning:</strong> Redaction is permanent. Content cannot be recovered after processing.
                          </div>
                        </>
                      )}

                      {!pdfFile && (
                        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
                          <p>Upload a PDF file above to start redacting</p>
                        </div>
                      )}
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

                  {activeTab === "crop" && (
                    <CropPdfPanel
                      pdfFile={pdfFile}
                      loading={loading}
                      setLoading={setLoading}
                      setResult={setResult}
                      setResultBlob={setResultBlob}
                    />
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
