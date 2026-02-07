import React, { useState, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { splitPdf, getErrorMessage } from "../api";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function SplitPdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [mode, setMode] = useState("pages"); // "pages" | "custom" | "fixed"
  const [customRanges, setCustomRanges] = useState([{ from: 1, to: 1 }]);
  const [fixedRangeSize, setFixedRangeSize] = useState(2);
  const [mergeAll, setMergeAll] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Get total page count from PDF
  useEffect(() => {
    if (!pdfFile) {
      setTotalPages(0);
      return;
    }

    let isCancelled = false;

    const loadPdf = async () => {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        if (isCancelled) return;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;
        setTotalPages(pageCount);
      } catch (error) {
        if (!isCancelled) {
          console.error("Error loading PDF:", error);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfFile]);

  // Add new custom range
  const addRange = () => {
    const lastRange = customRanges[customRanges.length - 1];
    const newStart = Math.min(lastRange.to + 1, totalPages);
    setCustomRanges([...customRanges, { from: newStart, to: Math.min(newStart, totalPages) }]);
  };

  // Remove custom range
  const removeRange = (index) => {
    if (customRanges.length > 1) {
      setCustomRanges(customRanges.filter((_, i) => i !== index));
    }
  };

  // Update custom range
  const updateRange = (index, field, value) => {
    const newRanges = [...customRanges];
    newRanges[index][field] = parseInt(value, 10) || 1;
    setCustomRanges(newRanges);
  };

  // Generate fixed ranges preview
  const generateFixedRanges = () => {
    if (!totalPages || fixedRangeSize < 1) return [];
    const ranges = [];
    for (let i = 1; i <= totalPages; i += fixedRangeSize) {
      ranges.push({
        from: i,
        to: Math.min(i + fixedRangeSize - 1, totalPages)
      });
    }
    return ranges;
  };

  const handleSplit = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    setLoading(true);
    try {
      let ranges = [];
      
      if (mode === "pages") {
        // Each page as separate PDF
        ranges = null; // Backend will handle this
      } else if (mode === "custom") {
        // Validate custom ranges
        for (const range of customRanges) {
          if (range.from < 1 || range.to > totalPages || range.from > range.to) {
            setResult({ 
              success: false, 
              error: `Invalid range: ${range.from}-${range.to}. Pages must be between 1 and ${totalPages}` 
            });
            setLoading(false);
            return;
          }
        }
        ranges = customRanges;
      } else if (mode === "fixed") {
        // Fixed range size
        if (fixedRangeSize < 1 || fixedRangeSize > totalPages) {
          setResult({ success: false, error: "Invalid range size" });
          setLoading(false);
          return;
        }
        ranges = generateFixedRanges();
      }

      const response = await splitPdf(pdfFile, mode, ranges, mergeAll);
      setResultBlob(response.data);
      
      const fileName = mergeAll ? "split-merged.pdf" : "split-pages.zip";
      setResult({ success: true, fileName });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const fixedRangesPreview = mode === "fixed" ? generateFixedRanges() : [];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-lg">Split PDF</h3>
      
      {pdfFile ? (
        <>
          {/* Total Pages Info */}
          {totalPages > 0 && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Total Pages:</span> {totalPages}
              </p>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("pages")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  mode === "pages"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                📄 Pages
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  mode === "custom"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                ✂️ Custom Ranges
              </button>
              <button
                onClick={() => setMode("fixed")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  mode === "fixed"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                📏 Fixed Range
              </button>
            </div>
          </div>

          {/* Mode-specific content */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {mode === "pages" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Split the PDF into individual pages. Each page will be saved as a separate PDF file.
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Output:</p>
                  <p className="text-sm font-medium text-gray-800">page-1.pdf, page-2.pdf, ... page-{totalPages}.pdf</p>
                  <p className="text-xs text-gray-500 mt-1">All files will be downloaded as a ZIP archive.</p>
                </div>
              </div>
            )}

            {mode === "custom" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Define custom page ranges. Each range will be saved as a separate PDF.
                </p>
                
                {/* Custom Ranges List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customRanges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                      <span className="text-xs font-medium text-gray-600 w-16">Range {index + 1}:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={range.from}
                        onChange={(e) => updateRange(index, "from", e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="From"
                      />
                      <span className="text-gray-500">→</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={range.to}
                        onChange={(e) => updateRange(index, "to", e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="To"
                      />
                      <span className="text-xs text-gray-500 flex-1">
                        ({range.to - range.from + 1} page{range.to - range.from !== 0 ? 's' : ''})
                      </span>
                      {customRanges.length > 1 && (
                        <button
                          onClick={() => removeRange(index)}
                          className="text-red-600 hover:text-red-800 text-sm px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addRange}
                  disabled={!totalPages}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                  + Add Range
                </button>
              </div>
            )}

            {mode === "fixed" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Split the PDF into chunks of a fixed number of pages.
                </p>
                
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Pages per split:</label>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={fixedRangeSize}
                    onChange={(e) => setFixedRangeSize(parseInt(e.target.value, 10) || 1)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                {/* Preview generated ranges */}
                {fixedRangesPreview.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs text-gray-600 mb-2">Preview ({fixedRangesPreview.length} files):</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {fixedRangesPreview.map((range, index) => (
                        <p key={index} className="text-xs text-gray-700">
                          range-{index + 1}.pdf: Pages {range.from}-{range.to}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Merge Option */}
          {mode !== "pages" && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeAll}
                  onChange={(e) => setMergeAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Merge all ranges into one PDF
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                {mergeAll 
                  ? "All ranges will be combined into a single PDF file" 
                  : "Each range will be saved as a separate PDF in a ZIP archive"}
              </p>
            </div>
          )}

          {/* Split Button */}
          <button
            onClick={handleSplit}
            disabled={loading || !totalPages}
            className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Splitting..." : "✂️ Split PDF"}
          </button>
        </>
      ) : (
        <div className="bg-blue-50 p-8 rounded-lg text-center text-blue-800">
          <p className="text-lg font-medium">📄 Upload a PDF file to split</p>
        </div>
      )}
    </div>
  );
}
