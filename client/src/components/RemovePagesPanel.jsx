import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { removePages, getErrorMessage } from "../api";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const THUMBNAIL_SCALE = 0.8;

export default function RemovePagesPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [removePagesRange, setRemovePagesRange] = useState("");
  const [thumbnails, setThumbnails] = useState({});
  const renderTasksRef = useRef({});

  // Load PDF and render thumbnails
  useEffect(() => {
    if (!pdfFile) {
      setTotalPages(0);
      setThumbnails({});
      setSelectedPages(new Set());
      setRemovePagesRange("");
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

        // Render all page thumbnails
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

  // Parse page ranges into a Set of page numbers
  const parsePageRanges = (rangeStr) => {
    const pages = new Set();
    if (!rangeStr.trim()) return pages;

    const parts = rangeStr.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map((n) => parseInt(n, 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pages.add(i);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
          pages.add(num);
        }
      }
    }
    return pages;
  };

  // Convert Set of page numbers to range format
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

  // Handle thumbnail click
  const handleThumbnailClick = (pageNum, event) => {
    const newSelected = new Set(selectedPages);
    
    if (event.shiftKey && selectedPages.size > 0) {
      // Shift-click: select range
      const lastSelected = Math.max(...selectedPages);
      const start = Math.min(pageNum, lastSelected);
      const end = Math.max(pageNum, lastSelected);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else {
      // Single click or Ctrl/Cmd-click: toggle this page
      if (newSelected.has(pageNum)) {
        newSelected.delete(pageNum);
      } else {
        newSelected.add(pageNum);
      }
    }

    setSelectedPages(newSelected);
    setRemovePagesRange(pagesToRangeFormat(newSelected));
  };

  // Handle page range input change
  const handleRangeInputChange = (value) => {
    setRemovePagesRange(value);
    const parsedPages = parsePageRanges(value);
    setSelectedPages(parsedPages);
  };

  // Handle remove pages
  const handleRemovePages = async () => {
    if (!pdfFile || selectedPages.size === 0) {
      setResult({ success: false, error: "Please select pages to remove" });
      return;
    }

    const rangeStr = removePagesRange.trim();
    if (!rangeStr) {
      setResult({ success: false, error: "Please enter page numbers to remove" });
      return;
    }

    setLoading(true);
    try {
      const response = await removePages(pdfFile, rangeStr);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "pages-removed.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {pdfFile ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Thumbnails Grid */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Select Pages to Remove (Total: {totalPages})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  onClick={(e) => handleThumbnailClick(pageNum, e)}
                  className={`relative cursor-pointer rounded border-2 transition-all ${
                    selectedPages.has(pageNum)
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
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
                  
                  {/* Page number label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-medium py-1 text-center">
                    Page {pageNum}
                  </div>

                  {/* Selection indicator */}
                  {selectedPages.has(pageNum) && (
                    <div className="absolute top-1 right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Click to select/deselect • Shift+Click to select range
            </p>
          </div>

          {/* Right Sidebar - Controls */}
          <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-gray-900">Remove Settings</h3>

            {/* Selection count */}
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-xs text-gray-600">Selected Pages</p>
              <p className="text-lg font-bold text-blue-600">{selectedPages.size}</p>
            </div>

            {/* Page range input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Page Numbers (e.g., 1,3,5-7)
              </label>
              <input
                type="text"
                value={removePagesRange}
                onChange={(e) => handleRangeInputChange(e.target.value)}
                placeholder="1,3,5-7"
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste page numbers or select from preview
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={handleRemovePages}
              disabled={loading || selectedPages.size === 0}
              className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
            >
              {loading ? "Removing..." : "🗑️ Remove Pages"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-8 rounded-lg text-center text-blue-800">
          <p className="text-lg font-medium">📄 Upload a PDF file to remove pages</p>
        </div>
      )}
    </div>
  );
}
