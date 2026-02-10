import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { extractPdf, getErrorMessage } from "../api";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const THUMBNAIL_SCALE = 0.8;

export default function ExtractPagesPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [thumbnails, setThumbnails] = useState({});
  const [mode, setMode] = useState("all"); // "all" | "select"
  const renderTasksRef = useRef({});

  useEffect(() => {
    if (!pdfFile) {
      setTotalPages(0);
      setThumbnails({});
      setSelectedPages(new Set());
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

        if (isCancelled) return;

        const thumbs = {};
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          if (isCancelled) break;

          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderTask = page.render({ canvasContext: context, viewport });
            renderTasksRef.current[pageNum] = renderTask;

            await renderTask.promise;
            if (isCancelled) break;

            thumbs[pageNum] = canvas.toDataURL("image/png");
            delete renderTasksRef.current[pageNum];
          } catch (err) {
            if (err.name !== "RenderingCancelledException") {
              console.error(`Error rendering page ${pageNum}:`, err);
            }
          }
        }

        if (!isCancelled) {
          setThumbnails(thumbs);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error loading PDF:", error);
          setResult({ success: false, error: "Failed to load PDF" });
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
      Object.values(renderTasksRef.current).forEach((task) => {
        if (task && task.cancel) {
          task.cancel();
        }
      });
      renderTasksRef.current = {};
    };
  }, [pdfFile, setResult]);

  useEffect(() => {
    if (totalPages === 0) return;
    if (mode === "all") {
      const allPages = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
      setSelectedPages(allPages);
      return;
    }

    if (mode === "select") {
      setSelectedPages(new Set());
    }
  }, [mode, totalPages]);

  const pagesToRangeFormat = (pagesSet) => {
    if (pagesSet.size === 0) return "";

    const sortedPages = Array.from(pagesSet).sort((a, b) => a - b);
    const ranges = [];
    let rangeStart = sortedPages[0];
    let rangeEnd = sortedPages[0];

    for (let i = 1; i < sortedPages.length; i++) {
      if (sortedPages[i] === rangeEnd + 1) {
        rangeEnd = sortedPages[i];
      } else {
        ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
        rangeStart = sortedPages[i];
        rangeEnd = sortedPages[i];
      }
    }
    ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);

    return ranges.join(",");
  };

  const handleThumbnailClick = (pageNum) => {
    if (mode !== "select") return;

    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum);
    } else {
      newSelected.add(pageNum);
    }

    setSelectedPages(newSelected);
  };

  const handleExtract = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please upload a PDF file" });
      return;
    }

    const rangeStr = pagesToRangeFormat(selectedPages);
    if (!rangeStr) {
      setResult({ success: false, error: "Please select pages to extract" });
      return;
    }

    setLoading(true);
    try {
      const response = await extractPdf(pdfFile, rangeStr);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "extracted.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedPages.size;

  return (
    <div className="flex gap-4 min-h-screen bg-gray-100">
      {/* Left: Page Preview Grid */}
      <div className="flex-1 overflow-auto max-h-screen p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              onClick={() => handleThumbnailClick(pageNum)}
              className={`relative cursor-pointer rounded border-2 transition-all bg-white shadow-sm hover:shadow-md ${
                selectedPages.has(pageNum)
                  ? "border-emerald-500"
                  : "border-gray-300 hover:border-gray-400"
              } ${mode !== "select" ? "cursor-default" : ""}`}
            >
              {thumbnails[pageNum] ? (
                <img
                  src={thumbnails[pageNum]}
                  alt={`Page ${pageNum}`}
                  className="w-full h-auto"
                />
              ) : (
                <div className="w-full aspect-[8.5/11] bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-400">Loading...</span>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-medium py-1 text-center">
                Page {pageNum}
              </div>

              {selectedPages.has(pageNum) && (
                <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Sticky Options Panel */}
      <div className="w-96 sticky top-0 h-screen overflow-y-auto bg-white shadow-lg p-6 border-l border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Extract Pages</h3>

        {/* Mode Tabs */}
        <div className="bg-gray-100 rounded-lg p-1 mb-6 flex gap-1">
          <button
            onClick={() => setMode("all")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
              mode === "all"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Extract all pages
          </button>
          <button
            onClick={() => setMode("select")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${
              mode === "select"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Select pages
          </button>
        </div>

        {/* Dynamic Info Box */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-emerald-900 font-medium mb-2">
            Selected pages will be converted into separate PDF files
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700">PDF files to be created</span>
            <span className="text-lg font-bold text-emerald-700">{selectedCount}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleExtract}
          disabled={loading || selectedCount === 0}
          className={`w-full py-3 rounded-lg font-bold text-white transition ${
            selectedCount > 0 && !loading
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Processing..." : "Split PDF"}
        </button>
      </div>
    </div>
  );
}
