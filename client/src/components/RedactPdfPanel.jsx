import React, { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { redactPdf, getErrorMessage } from "../api";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PREVIEW_SCALE = 1.25;
const THUMB_SCALE = 0.18;

export default function RedactPdfPanel({
  pdfFile,
  loading,
  setLoading,
  setResult,
  setResultBlob,
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState({});
  const [activePage, setActivePage] = useState(0);

  const [areaRedactions, setAreaRedactions] = useState([]);
  const [textQuery, setTextQuery] = useState("");
  const [textMatches, setTextMatches] = useState([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const [drawPageIndex, setDrawPageIndex] = useState(null);

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const canvasRefs = useRef([]);

  useEffect(() => {
    if (!pdfFile) {
      setPdfDoc(null);
      setPageCount(0);
      setThumbnails({});
      setAreaRedactions([]);
      setTextMatches([]);
      setActivePage(0);
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
      setAreaRedactions([]);
      setTextMatches([]);
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [pdfFile]);

  useEffect(() => {
    if (!pdfDoc || pageCount === 0) return;
    let cancelled = false;

    const renderThumbnails = async () => {
      const thumbs = {};
      for (let i = 0; i < pageCount; i++) {
        if (cancelled) return;
        const page = await pdfDoc.getPage(i + 1);
        const viewport = page.getViewport({ scale: THUMB_SCALE });
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
  }, [pdfDoc, pageCount]);

  useEffect(() => {
    if (!pdfDoc || pageCount === 0) return;
    let cancelled = false;

    const renderPages = async () => {
      for (let i = 0; i < pageCount; i++) {
        if (cancelled) return;
        const canvas = canvasRefs.current[i];
        if (!canvas) continue;
        const page = await pdfDoc.getPage(i + 1);
        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    };

    renderPages();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageCount]);

  const scrollToPage = (pageIndex) => {
    const target = pageRefs.current[pageIndex];
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActivePage(pageIndex);
    }
  };

  const getRelativePoint = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleDrawStart = (pageIndex, e) => {
    const point = getRelativePoint(e);
    setIsDrawing(true);
    setDrawPageIndex(pageIndex);
    setDrawStart(point);
    setDrawCurrent(null);
  };

  const handleDrawMove = (pageIndex, e) => {
    if (!isDrawing || drawPageIndex !== pageIndex || !drawStart) return;
    const point = getRelativePoint(e);
    setDrawCurrent(point);
  };

  const handleDrawEnd = (pageIndex, e) => {
    if (!isDrawing || drawPageIndex !== pageIndex || !drawStart) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const end = getRelativePoint(e);
    const xRatio = Math.min(drawStart.x, end.x);
    const yRatio = Math.min(drawStart.y, end.y);
    const widthRatio = Math.abs(end.x - drawStart.x);
    const heightRatio = Math.abs(end.y - drawStart.y);

    if (widthRatio > 0.01 && heightRatio > 0.01) {
      setAreaRedactions((prev) => [
        ...prev,
        {
          id: `area-${Date.now()}-${Math.random()}`,
          pageIndex,
          xRatio,
          yRatio,
          widthRatio,
          heightRatio,
          source: "area",
          enabled: true,
        },
      ]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
    setDrawPageIndex(null);
  };

  const runTextSearch = async () => {
    if (!pdfDoc || !textQuery.trim()) {
      setTextMatches([]);
      return;
    }

    const query = textQuery.trim().toLowerCase();
    const matches = [];

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: PREVIEW_SCALE });
      const content = await page.getTextContent();
      const items = content.items || [];

      const mapped = [];
      let charOffset = 0;
      items.forEach((item) => {
        const str = item.str || "";
        const start = charOffset;
        charOffset += str.length;
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const x = tx[4];
        const y = tx[5];
        const height = Math.hypot(tx[2], tx[3]);
        const width = item.width * viewport.scale;
        mapped.push({ start, end: charOffset, x, y, width, height });
      });

      const fullText = items.map((i) => i.str).join("").toLowerCase();
      let idx = 0;
      while ((idx = fullText.indexOf(query, idx)) !== -1) {
        const end = idx + query.length;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        mapped.forEach((item) => {
          if (item.end <= idx || item.start >= end) return;
          minX = Math.min(minX, item.x);
          minY = Math.min(minY, item.y);
          maxX = Math.max(maxX, item.x + item.width);
          maxY = Math.max(maxY, item.y + item.height);
        });

        if (minX !== Infinity && minY !== Infinity) {
          matches.push({
            id: `text-${pageIndex}-${idx}-${matches.length}`,
            pageIndex,
            xRatio: minX / viewport.width,
            yRatio: minY / viewport.height,
            widthRatio: (maxX - minX) / viewport.width,
            heightRatio: (maxY - minY) / viewport.height,
            source: "text",
            enabled: true,
            text: textQuery.trim(),
          });
        }
        idx += query.length;
      }
    }

    setTextMatches(matches);
  };

  const toggleMatch = (id) => {
    setTextMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const togglePageMatches = (pageIndex, enabled) => {
    setTextMatches((prev) =>
      prev.map((m) =>
        m.pageIndex === pageIndex ? { ...m, enabled } : m
      )
    );
  };

  const groupedMatches = useMemo(() => {
    const groups = {};
    textMatches.forEach((m) => {
      if (!groups[m.pageIndex]) groups[m.pageIndex] = [];
      groups[m.pageIndex].push(m);
    });
    return groups;
  }, [textMatches]);

  const combinedRedactions = useMemo(() => {
    const enabledText = textMatches.filter((m) => m.enabled);
    const enabledAreas = areaRedactions.filter((r) => r.enabled !== false);
    return [...enabledAreas, ...enabledText];
  }, [areaRedactions, textMatches]);

  const handleApply = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    if (combinedRedactions.length === 0) {
      setResult({ success: false, error: "Please add at least one redaction" });
      return;
    }

    setLoading(true);
    try {
      const response = await redactPdf(pdfFile, combinedRedactions);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "redacted.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAreaRedactions([]);
    setTextMatches([]);
    setTextQuery("");
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 text-lg">Redact PDF</h3>

      {!pdfFile && (
        <div className="bg-blue-50 p-6 rounded text-center text-blue-800">
          <p>Upload a PDF file above to start redacting</p>
        </div>
      )}

      {pdfFile && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left Thumbnails */}
          <div className="col-span-12 lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-3 h-full">
              <p className="text-xs font-semibold text-gray-600 mb-2">Pages</p>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {Array.from({ length: pageCount }, (_, i) => i).map((pageIndex) => (
                  <button
                    key={pageIndex}
                    onClick={() => scrollToPage(pageIndex)}
                    className={`w-full border rounded p-1 text-left ${
                      activePage === pageIndex
                        ? "border-blue-600 ring-2 ring-blue-200"
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
                    <div className="text-xs text-gray-600 mt-1">Page {pageIndex + 1}</div>
                  </button>
                ))}
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
              {Array.from({ length: pageCount }, (_, pageIndex) => (
                <div
                  key={pageIndex}
                  ref={(el) => (pageRefs.current[pageIndex] = el)}
                  className="mb-6"
                >
                  <div className="text-xs text-gray-500 mb-2">Page {pageIndex + 1}</div>
                  <div className="relative inline-block">
                    <canvas
                      ref={(el) => (canvasRefs.current[pageIndex] = el)}
                      className="block border border-gray-200"
                    />

                    {/* Area Redactions Overlay */}
                    {areaRedactions
                      .filter((r) => r.pageIndex === pageIndex)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="absolute bg-black/90"
                          style={{
                            left: `${r.xRatio * 100}%`,
                            top: `${r.yRatio * 100}%`,
                            width: `${r.widthRatio * 100}%`,
                            height: `${r.heightRatio * 100}%`,
                          }}
                        />
                      ))}

                    {/* Text Matches Overlay */}
                    {textMatches
                      .filter((m) => m.pageIndex === pageIndex)
                      .map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          onClick={() => toggleMatch(m.id)}
                          className={`absolute border transition-colors ${
                            m.enabled
                              ? "bg-red-600/30 border-red-600"
                              : "bg-gray-500/20 border-gray-400"
                          }`}
                          style={{
                            left: `${m.xRatio * 100}%`,
                            top: `${m.yRatio * 100}%`,
                            width: `${m.widthRatio * 100}%`,
                            height: `${m.heightRatio * 100}%`,
                          }}
                        />
                      ))}

                    {/* Drawing Layer */}
                    <div
                      className="absolute inset-0"
                      onMouseDown={(e) => handleDrawStart(pageIndex, e)}
                      onMouseMove={(e) => handleDrawMove(pageIndex, e)}
                      onMouseUp={(e) => handleDrawEnd(pageIndex, e)}
                      onMouseLeave={(e) => handleDrawEnd(pageIndex, e)}
                    />

                    {isDrawing && drawPageIndex === pageIndex && drawStart && drawCurrent && (
                      <div
                        className="absolute bg-black/60"
                        style={{
                          left: `${Math.min(drawStart.x, drawCurrent.x) * 100}%`,
                          top: `${Math.min(drawStart.y, drawCurrent.y) * 100}%`,
                          width: `${Math.abs(drawCurrent.x - drawStart.x) * 100}%`,
                          height: `${Math.abs(drawCurrent.y - drawStart.y) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">Search text</label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={textQuery}
                    onChange={(e) => setTextQuery(e.target.value)}
                    placeholder="Name, email, ID..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={runTextSearch}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Find
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Matches are highlighted in red. Click highlights to toggle.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Detected matches</p>
                <div className="max-h-52 overflow-y-auto space-y-3">
                  {Object.keys(groupedMatches).length === 0 && (
                    <p className="text-xs text-gray-400">No text matches yet.</p>
                  )}
                  {Object.entries(groupedMatches).map(([pageIndexStr, matches]) => {
                    const pageIndex = Number(pageIndexStr);
                    const allEnabled = matches.every((m) => m.enabled);
                    const anyEnabled = matches.some((m) => m.enabled);
                    return (
                      <div key={pageIndexStr} className="border border-gray-100 rounded p-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={allEnabled}
                            onChange={(e) => togglePageMatches(pageIndex, e.target.checked)}
                          />
                          Page {pageIndex + 1}
                          <span className="text-[10px] text-gray-400">
                            ({matches.filter((m) => m.enabled).length}/{matches.length})
                          </span>
                        </label>
                        <div className="mt-2 space-y-1">
                          {matches.map((m) => (
                            <label key={m.id} className="flex items-center gap-2 text-xs text-gray-600">
                              <input
                                type="checkbox"
                                checked={m.enabled}
                                onChange={() => toggleMatch(m.id)}
                              />
                              {m.text}
                            </label>
                          ))}
                        </div>
                        {!anyEnabled && (
                          <p className="text-[10px] text-red-500 mt-1">All matches disabled</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Area redactions</span>
                  <span>{areaRedactions.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                  <span>Text redactions</span>
                  <span>{textMatches.filter((m) => m.enabled).length}</span>
                </div>
              </div>

              <button
                onClick={handleApply}
                disabled={loading || combinedRedactions.length === 0}
                className="w-full bg-red-600 text-white py-3 rounded font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Apply Redactions"}
              </button>
              <button
                onClick={handleCancel}
                className="w-full border border-gray-300 text-gray-700 py-2 rounded font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              <div className="bg-yellow-50 border border-yellow-300 p-3 rounded text-xs text-yellow-800">
                <strong>⚠️ Permanent:</strong> Redaction permanently removes content from the output PDF.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
