import React, { useEffect, useRef, useState } from "react";
import { cropPdf, getErrorMessage } from "../api";

const PREVIEW_SCALE = 1.5;
const HANDLE_SIZE = 10;
const MIN_BOX_SIZE = 20;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const pointInBox = (x, y, box) =>
  x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;

const getHandleAtPoint = (x, y, box) => {
  const handles = [
    { key: "nw", x: box.x, y: box.y },
    { key: "ne", x: box.x + box.width, y: box.y },
    { key: "sw", x: box.x, y: box.y + box.height },
    { key: "se", x: box.x + box.width, y: box.y + box.height },
  ];

  for (const handle of handles) {
    if (
      x >= handle.x - HANDLE_SIZE &&
      x <= handle.x + HANDLE_SIZE &&
      y >= handle.y - HANDLE_SIZE &&
      y <= handle.y + HANDLE_SIZE
    ) {
      return handle.key;
    }
  }
  return null;
};

const toPixelBox = (box, canvas) => {
  if (!box || !canvas) return null;
  return {
    x: box.xRatio * canvas.width,
    y: box.yRatio * canvas.height,
    width: box.widthRatio * canvas.width,
    height: box.heightRatio * canvas.height,
  };
};

const toRatioBox = (box, canvas) => {
  if (!box || !canvas) return null;
  return {
    xRatio: box.x / canvas.width,
    yRatio: box.y / canvas.height,
    widthRatio: box.width / canvas.width,
    heightRatio: box.height / canvas.height,
  };
};

export default function CropPdfPanel({
  pdfFile,
  loading,
  setLoading,
  setResult,
  setResultBlob,
}) {
  const [cropMode, setCropMode] = useState("all_pages");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [cropBox, setCropBox] = useState(null); // ratio-based
  const [pageSize, setPageSize] = useState(null); // PDF points (scale 1)

  const pdfCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const renderIdRef = useRef(0);
  const dragState = useRef({ type: null, start: null, startBox: null });

  useEffect(() => {
    if (!pdfFile) return;

    let isCancelled = false;
    const renderId = ++renderIdRef.current;

    const renderPage = async () => {
      const baseCanvas = pdfCanvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      if (!baseCanvas || !overlayCanvas) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        try {
          await renderTaskRef.current.promise;
        } catch {
          // Ignore cancel errors
        }
        renderTaskRef.current = null;
      }

      try {
        const buffer = await pdfFile.arrayBuffer();
        if (isCancelled || renderId !== renderIdRef.current) return;

        const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
        GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const pdf = await getDocument({ data: buffer }).promise;
        if (isCancelled || renderId !== renderIdRef.current) return;

        setPageCount(pdf.numPages || 1);

        const safePageNumber = clamp(pageNumber, 1, pdf.numPages || 1);
        if (safePageNumber !== pageNumber) {
          setPageNumber(safePageNumber);
        }

        const page = await pdf.getPage(safePageNumber);
        if (isCancelled || renderId !== renderIdRef.current) return;

        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        const pageViewport = page.getViewport({ scale: 1 });

        baseCanvas.width = viewport.width;
        baseCanvas.height = viewport.height;
        overlayCanvas.width = viewport.width;
        overlayCanvas.height = viewport.height;

        setPageSize({ width: pageViewport.width, height: pageViewport.height });

        const ctx = baseCanvas.getContext("2d");
        renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;
      } catch (err) {
        if (isCancelled || renderId !== renderIdRef.current) return;
        console.error("Error rendering PDF:", err);
        const ctx = baseCanvas.getContext("2d");
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);
        ctx.fillStyle = "#c00";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Error rendering PDF", baseCanvas.width / 2, baseCanvas.height / 2);
      }
    };

    renderPage();
    setCropBox(null);
    return () => {
      isCancelled = true;
      renderIdRef.current += 1;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfFile, pageNumber]);

  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const baseCanvas = pdfCanvasRef.current;
    if (!overlayCanvas || !baseCanvas) return;

    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (!cropBox) return;

    const pixelBox = toPixelBox(cropBox, baseCanvas);
    if (!pixelBox) return;

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(pixelBox.x, pixelBox.y, pixelBox.width, pixelBox.height);
    ctx.globalCompositeOperation = "source-over";

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.strokeRect(pixelBox.x, pixelBox.y, pixelBox.width, pixelBox.height);

    ctx.fillStyle = "#111";
    const handles = [
      { x: pixelBox.x, y: pixelBox.y },
      { x: pixelBox.x + pixelBox.width, y: pixelBox.y },
      { x: pixelBox.x, y: pixelBox.y + pixelBox.height },
      { x: pixelBox.x + pixelBox.width, y: pixelBox.y + pixelBox.height },
    ];
    handles.forEach((h) => {
      ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    });
  }, [cropBox]);

  const getCanvasPoint = (e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    if (!pdfFile) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    const baseCanvas = pdfCanvasRef.current;
    if (!baseCanvas) return;

    const pixelBox = cropBox ? toPixelBox(cropBox, baseCanvas) : null;
    const handle = pixelBox ? getHandleAtPoint(point.x, point.y, pixelBox) : null;

    if (handle) {
      dragState.current = {
        type: `resize-${handle}`,
        start: point,
        startBox: pixelBox,
      };
      return;
    }

    if (pixelBox && pointInBox(point.x, point.y, pixelBox)) {
      dragState.current = {
        type: "move",
        start: point,
        startBox: pixelBox,
      };
      return;
    }

    dragState.current = {
      type: "new",
      start: point,
      startBox: { x: point.x, y: point.y, width: 0, height: 0 },
    };
    setCropBox(toRatioBox({ x: point.x, y: point.y, width: 0, height: 0 }, baseCanvas));
  };

  const handleMouseMove = (e) => {
    const canvas = pdfCanvasRef.current;
    if (!canvas) return;
    const state = dragState.current;
    if (!state.type) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    const { start, startBox } = state;
    let nextBox = { ...startBox };

    if (state.type === "new") {
      nextBox = {
        x: Math.min(start.x, point.x),
        y: Math.min(start.y, point.y),
        width: Math.abs(point.x - start.x),
        height: Math.abs(point.y - start.y),
      };
    } else if (state.type === "move") {
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      nextBox = {
        ...startBox,
        x: clamp(startBox.x + dx, 0, canvas.width - startBox.width),
        y: clamp(startBox.y + dy, 0, canvas.height - startBox.height),
      };
    } else if (state.type.startsWith("resize-")) {
      const handle = state.type.replace("resize-", "");
      const right = startBox.x + startBox.width;
      const bottom = startBox.y + startBox.height;

      if (handle.includes("n")) {
        const newY = clamp(point.y, 0, bottom - MIN_BOX_SIZE);
        nextBox.y = newY;
        nextBox.height = bottom - newY;
      }
      if (handle.includes("s")) {
        const newHeight = clamp(point.y - startBox.y, MIN_BOX_SIZE, canvas.height - startBox.y);
        nextBox.height = newHeight;
      }
      if (handle.includes("w")) {
        const newX = clamp(point.x, 0, right - MIN_BOX_SIZE);
        nextBox.x = newX;
        nextBox.width = right - newX;
      }
      if (handle.includes("e")) {
        const newWidth = clamp(point.x - startBox.x, MIN_BOX_SIZE, canvas.width - startBox.x);
        nextBox.width = newWidth;
      }
    }

    nextBox.width = Math.max(nextBox.width, MIN_BOX_SIZE);
    nextBox.height = Math.max(nextBox.height, MIN_BOX_SIZE);
    nextBox.x = clamp(nextBox.x, 0, canvas.width - nextBox.width);
    nextBox.y = clamp(nextBox.y, 0, canvas.height - nextBox.height);

    setCropBox(toRatioBox(nextBox, canvas));
  };

  const handleMouseUp = () => {
    dragState.current = { type: null, start: null, startBox: null };
  };

  const handleReset = () => {
    setCropBox(null);
  };

  const handleCrop = async () => {
    if (!pdfFile || !cropBox || !pageSize) {
      setResult({
        success: false,
        error: "Please draw a crop area on the PDF",
      });
      return;
    }

    const pdfX = cropBox.xRatio * pageSize.width;
    const pdfWidth = cropBox.widthRatio * pageSize.width;
    const pdfYTop = cropBox.yRatio * pageSize.height;
    const pdfHeight = cropBox.heightRatio * pageSize.height;
    const pdfY = pageSize.height - pdfYTop - pdfHeight;

    setLoading(true);
    try {
      const pageNumbers = cropMode === "current_page" ? String(pageNumber) : null;
      const response = await cropPdf(pdfFile, pdfX, pdfY, pdfWidth, pdfHeight, pageNumbers);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "cropped.pdf",
      });
      setCropBox(null);
    } catch (error) {
      setResult({
        success: false,
        error: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-2">Crop PDF</h3>
      <p className="text-sm text-gray-600">
        Click and drag to select the area you want to keep. Resize if needed.
      </p>

      {pdfFile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 relative overflow-auto"
              style={{ minHeight: "400px", maxHeight: "500px" }}
            >
              <div className="relative inline-block">
                <canvas ref={pdfCanvasRef} className="block" />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Apply to:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="cropMode"
                    value="all_pages"
                    checked={cropMode === "all_pages"}
                    onChange={() => setCropMode("all_pages")}
                  />
                  All pages
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="cropMode"
                    value="current_page"
                    checked={cropMode === "current_page"}
                    onChange={() => setCropMode("current_page")}
                  />
                  Current page
                </label>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Preview page
                </label>
                <input
                  type="number"
                  min="1"
                  max={pageCount}
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value || "1", 10))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
                {cropMode === "current_page" && (
                  <p className="text-xs text-gray-500 mt-1">Crop will be applied to this page only.</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Reset all
              </button>
              <button
                onClick={handleCrop}
                disabled={loading || !cropBox}
                className="flex-1 bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Crop PDF"}
              </button>
            </div>

            {cropBox && (
              <div className="text-xs text-gray-500">
                Tip: Drag corners to resize, or drag inside the box to move.
              </div>
            )}
          </div>
        </div>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to start cropping</p>
        </div>
      )}
    </>
  );
}
