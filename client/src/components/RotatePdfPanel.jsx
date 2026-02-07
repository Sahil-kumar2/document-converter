import React, { useState, useRef, useEffect, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { rotatePdf, getErrorMessage } from "../api";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PREVIEW_SCALE = 1.25;
const THUMB_SCALE = 0.18;

export default function RotatePdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState({});
  const [pageRotations, setPageRotations] = useState({}); // { pageIndex: rotation }
  const [activePage, setActivePage] = useState(0);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [rotationMode, setRotationMode] = useState("all"); // "current" | "selected" | "all"

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const canvasRefs = useRef([]);
  const renderTasksRef = useRef({});

  // Load PDF document
  useEffect(() => {
    if (!pdfFile) {
      setPdfDoc(null);
      setPageCount(0);
      setThumbnails({});
      setPageRotations({});
      setActivePage(0);
      setSelectedPages(new Set());
      return;
    }

    let cancelled = false;

    const loadPdf = async () => {
      const buffer = await pdfFile.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
      if (cancelled) return;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setActivePage(0);
      setPageRotations({});
      setSelectedPages(new Set());
    };

    loadPdf();

    return () => {
      cancelled = true;
      Object.values(renderTasksRef.current).forEach((task) => {
        if (task && task.cancel) task.cancel();
      });
      renderTasksRef.current = {};
    };
  }, [pdfFile]);

  // Render thumbnails
  useEffect(() => {
    if (!pdfDoc || pageCount === 0) return;
    let cancelled = false;

    const renderThumbnails = async () => {
      const thumbs = {};
      for (let i = 0; i < pageCount; i++) {
        if (cancelled) return;
        const page = await pdfDoc.getPage(i + 1);
        const rotation = pageRotations[i] || 0;
        const viewport = page.getViewport({ scale: THUMB_SCALE, rotation });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs[i] = canvas.toDataURL("image/png");
      }
      if (!cancelled) setThumbnails(thumbs);
    };

    renderThumbnails();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageCount, pageRotations]);

  // Render main preview pages
  useEffect(() => {
    if (!pdfDoc || pageCount === 0) return;
    let cancelled = false;

    const renderPages = async () => {
      for (let i = 0; i < pageCount; i++) {
        if (cancelled) return;
        const canvas = canvasRefs.current[i];
        if (!canvas) continue;
        
        if (renderTasksRef.current[i]) {
          renderTasksRef.current[i].cancel();
          try {
            await renderTasksRef.current[i].promise;
          } catch (err) {
            if (err.name !== 'RenderingCancelledException') {
              console.error('Render error:', err);
            }
          }
        }
        
        const page = await pdfDoc.getPage(i + 1);
        const rotation = pageRotations[i] || 0;
        const viewport = page.getViewport({ scale: PREVIEW_SCALE, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTasksRef.current[i] = renderTask;
        await renderTask.promise;
        delete renderTasksRef.current[i];
      }
    };

    renderPages();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageCount, pageRotations]);

  const scrollToPage = (pageIndex) => {
    const target = pageRefs.current[pageIndex];
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActivePage(pageIndex);
    }
  };

  const togglePageSelection = (pageIndex) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageIndex)) {
        newSet.delete(pageIndex);
      } else {
        newSet.add(pageIndex);
      }
      return newSet;
    });
  };

  const getTargetPages = () => {
    if (rotationMode === "current") return [activePage];
    if (rotationMode === "selected") return Array.from(selectedPages);
    return Array.from({ length: pageCount }, (_, i) => i);
  };

  const handleRotateRight = () => {
    const targets = getTargetPages();
    if (targets.length === 0) return;
    setPageRotations((prev) => {
      const updated = { ...prev };
      targets.forEach((pageIndex) => {
        const current = prev[pageIndex] || 0;
        updated[pageIndex] = (current + 90) % 360;
      });
      return updated;
    });
  };

  const handleRotateLeft = () => {
    const targets = getTargetPages();
    if (targets.length === 0) return;
    setPageRotations((prev) => {
      const updated = { ...prev };
      targets.forEach((pageIndex) => {
        const current = prev[pageIndex] || 0;
        updated[pageIndex] = (current - 90 + 360) % 360;
      });
      return updated;
    });
  };

  const handleResetAll = () => {
    setPageRotations({});
  };

  const hasRotations = useMemo(() => {
    return Object.values(pageRotations).some((rot) => rot !== 0);
  }, [pageRotations]);

  const handleApply = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    if (!hasRotations) {
      setResult({ success: false, error: "No rotations applied" });
      return;
    }

    setLoading(true);
    try {
      const response = await rotatePdf(pdfFile, pageRotations);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "rotated.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-lg">Rotate PDF</h3>

      {!pdfFile && (
        <div className="bg-blue-50 p-6 rounded text-center text-blue-800">
          <p>Upload a PDF file above to rotate pages</p>
        </div>
      )}

      {pdfFile && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left Thumbnails */}
          <div className="col-span-12 lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-3 h-full">
              <p className="text-xs font-semibold text-gray-600 mb-2">Pages</p>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {Array.from({ length: pageCount }, (_, i) => i).map((pageIndex) => {
                  const rotation = pageRotations[pageIndex] || 0;
                  const isSelected = selectedPages.has(pageIndex);
                  return (
                    <div key={pageIndex} className="relative">
                      <button
                        onClick={() => scrollToPage(pageIndex)}
                        className={`w-full border rounded p-1 text-left ${
                          activePage === pageIndex
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : isSelected && rotationMode === "selected"
                            ? "border-green-500 ring-2 ring-green-200"
                            : "border-gray-200"
                        }`}
                      >
                        {thumbnails[pageIndex] ? (
                          <img
                            src={thumbnails[pageIndex]}
                            alt={`Page ${pageIndex + 1}`}
                            className="w-full h-auto"
                          />
                        ) : (
                          <div className="bg-gray-100 h-32 flex items-center justify-center text-xs text-gray-400">
                            Loading...
                          </div>
                        )}
                        <div className="text-xs text-gray-600 mt-1 flex items-center justify-between">
                          <span>Page {pageIndex + 1}</span>
                          {rotation !== 0 && (
                            <span className="text-blue-600 font-semibold">{rotation}°</span>
                          )}
                        </div>
                      </button>
                      {rotationMode === "selected" && (
                        <label 
                          className="absolute top-2 left-2 cursor-pointer bg-white rounded border border-gray-300 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePageSelection(pageIndex)}
                            className="w-5 h-5 text-green-600 cursor-pointer"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Preview */}
          <div className="col-span-12 lg:col-span-7">
            <div
              ref={scrollContainerRef}
              className="bg-white border border-gray-200 rounded-lg p-4 h-[75vh] overflow-y-auto"
              onScroll={() => {
                if (!scrollContainerRef.current) return;
                const scrollTop = scrollContainerRef.current.scrollTop;
                const offsets = pageRefs.current.map((el) => (el ? el.offsetTop : 0));
                let current = 0;
                offsets.forEach((offset, index) => {
                  if (scrollTop >= offset - 10) current = index;
                });
                setActivePage(current);
              }}
            >
              {Array.from({ length: pageCount }, (_, pageIndex) => {
                const rotation = pageRotations[pageIndex] || 0;
                return (
                  <div
                    key={pageIndex}
                    ref={(el) => (pageRefs.current[pageIndex] = el)}
                    className="mb-6"
                  >
                    <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
                      <span>Page {pageIndex + 1}</span>
                      {rotation !== 0 && (
                        <span className="text-blue-600 font-semibold">Rotated {rotation}°</span>
                      )}
                    </div>
                    <div className="inline-block border border-gray-200">
                      <canvas ref={(el) => (canvasRefs.current[pageIndex] = el)} className="block" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-600">Rotation Controls</h3>

              <div>
                <label className="text-xs font-semibold text-gray-600">Apply to</label>
                <select
                  value={rotationMode}
                  onChange={(e) => setRotationMode(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="current">Current Page</option>
                  <option value="selected">Selected Pages</option>
                  <option value="all">All Pages</option>
                </select>
                {rotationMode === "selected" && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-800">
                      <strong>{selectedPages.size}</strong> page{selectedPages.size !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      ✓ Click checkboxes on page thumbnails to select
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleRotateLeft}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-medium text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  ⟲ Rotate Left
                </button>

                <button
                  onClick={handleRotateRight}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm font-medium text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                  Rotate Right ⟳
                </button>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                  <span>Rotated pages</span>
                  <span>{Object.values(pageRotations).filter((r) => r !== 0).length}</span>
                </div>
                <button
                  onClick={handleResetAll}
                  className="w-full text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Reset All Rotations
                </button>
              </div>

              <button
                onClick={handleApply}
                disabled={loading || !hasRotations}
                className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Rotating..." : "🔄 Rotate PDF"}
              </button>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-800">
                <strong>Note:</strong> Rotation is applied permanently to the downloaded PDF.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
