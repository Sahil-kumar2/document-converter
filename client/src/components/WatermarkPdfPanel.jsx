import React, { useEffect, useMemo, useRef, useState } from "react";
import { watermarkPdf, getErrorMessage } from "../api";

const PREVIEW_SCALE = 1.5;
const POSITION_PRESETS = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const PRESET_RATIO = {
  left: 0.15,
  center: 0.5,
  right: 0.85,
  top: 0.15,
  bottom: 0.85,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getPresetRatios = (preset) => {
  if (!preset) return { xRatio: 0.5, yRatio: 0.5 };
  const lower = preset.toLowerCase();
  const xRatio = lower.includes("left")
    ? PRESET_RATIO.left
    : lower.includes("right")
    ? PRESET_RATIO.right
    : PRESET_RATIO.center;
  const yRatio = lower.includes("top")
    ? PRESET_RATIO.top
    : lower.includes("bottom")
    ? PRESET_RATIO.bottom
    : PRESET_RATIO.center;
  return { xRatio, yRatio };
};

export default function WatermarkPdfPanel({
  pdfFile,
  loading,
  setLoading,
  setResult,
  setResultBlob,
}) {
  const [watermarkType, setWatermarkType] = useState("text");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontColor, setFontColor] = useState("#666666");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [imageScale, setImageScale] = useState(0.3);
  const [imageFile, setImageFile] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [pageScope, setPageScope] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pageSize, setPageSize] = useState(null);
  const [positionPreset, setPositionPreset] = useState("center");
  const [{ xRatio, yRatio }, setPositionRatios] = useState({ xRatio: 0.5, yRatio: 0.5 });

  const pdfCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const renderIdRef = useRef(0);
  const dragStateRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const fontStyle = useMemo(() => {
    const styleParts = [];
    if (italic) styleParts.push("italic");
    if (bold) styleParts.push("bold");
    styleParts.push(`${fontSize * PREVIEW_SCALE}px`);
    styleParts.push(fontFamily);
    return styleParts.join(" ");
  }, [italic, bold, fontSize, fontFamily]);

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
        const ctx = pdfCanvasRef.current?.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#f3f4f6";
        ctx.fillRect(0, 0, pdfCanvasRef.current.width, pdfCanvasRef.current.height);
        ctx.fillStyle = "#c00";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Error rendering PDF", pdfCanvasRef.current.width / 2, pdfCanvasRef.current.height / 2);
      }
    };

    renderPage();
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
    if (!imageFile) {
      setImageElement(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => setImageElement(img);
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  useEffect(() => {
    if (!pdfFile) return;
    setPositionPreset("center");
    setPositionRatios({ xRatio: 0.5, yRatio: 0.5 });
    setPageNumber(1);
    setPageScope("all");
    setWatermarkType("text");
    setWatermarkText("CONFIDENTIAL");
    setFontSize(48);
    setFontFamily("Helvetica");
    setFontColor("#666666");
    setBold(false);
    setItalic(false);
    setOpacity(0.3);
    setRotation(-45);
    setImageScale(0.3);
    setImageFile(null);
  }, [pdfFile]);

  const getWatermarkSizePx = (ctx, canvas) => {
    if (!canvas) return null;
    if (watermarkType === "image") {
      if (!imageElement || !pageSize) return null;
      const width = pageSize.width * imageScale * PREVIEW_SCALE;
      const height = width * (imageElement.height / imageElement.width);
      return { width, height };
    }

    if (!watermarkText?.trim()) return null;
    ctx.font = fontStyle;
    const width = ctx.measureText(watermarkText).width;
    const height = fontSize * PREVIEW_SCALE;
    return { width, height };
  };

  const getWatermarkBox = (ctx, canvas) => {
    const size = getWatermarkSizePx(ctx, canvas);
    if (!size) return null;
    const rawX = xRatio * canvas.width - size.width / 2;
    const rawY = yRatio * canvas.height - size.height / 2;
    const x = clamp(rawX, 0, Math.max(0, canvas.width - size.width));
    const y = clamp(rawY, 0, Math.max(0, canvas.height - size.height));
    return { x, y, width: size.width, height: size.height };
  };

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = getWatermarkSizePx(ctx, canvas);
    if (!size) return;

    const rawX = xRatio * canvas.width - size.width / 2;
    const rawY = yRatio * canvas.height - size.height / 2;
    const clampedX = clamp(rawX, 0, Math.max(0, canvas.width - size.width));
    const clampedY = clamp(rawY, 0, Math.max(0, canvas.height - size.height));
    const centerX = clampedX + size.width / 2;
    const centerY = clampedY + size.height / 2;
    const nextXRatio = clamp(centerX / canvas.width, 0, 1);
    const nextYRatio = clamp(centerY / canvas.height, 0, 1);

    if (Math.abs(nextXRatio - xRatio) > 0.0001 || Math.abs(nextYRatio - yRatio) > 0.0001) {
      setPositionRatios({ xRatio: nextXRatio, yRatio: nextYRatio });
    }
  }, [
    xRatio,
    yRatio,
    watermarkType,
    watermarkText,
    fontStyle,
    imageElement,
    imageScale,
    pageSize,
  ]);

  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas || !pdfFile) return;

    const ctx = overlayCanvas.getContext("2d");
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    const box = getWatermarkBox(ctx, overlayCanvas);
    if (!box) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(box.x, box.y);
    ctx.rotate((rotation * Math.PI) / 180);

    if (watermarkType === "image" && imageElement) {
      ctx.drawImage(imageElement, 0, 0, box.width, box.height);
    } else {
      ctx.font = fontStyle;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = fontColor;
      ctx.fillText(watermarkText, 0, box.height);
    }

    ctx.restore();

    ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.setLineDash([]);
  }, [
    pdfFile,
    watermarkType,
    watermarkText,
    fontStyle,
    fontColor,
    opacity,
    rotation,
    imageElement,
    imageScale,
    pageSize,
    xRatio,
    yRatio,
  ]);

  const handlePositionPreset = (preset) => {
    const { xRatio: presetX, yRatio: presetY } = getPresetRatios(preset);
    setPositionPreset(preset);
    setPositionRatios({ xRatio: presetX, yRatio: presetY });
  };

  const handleMouseDown = (e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const box = getWatermarkBox(ctx, canvas);
    if (!box) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const inside =
      mouseX >= box.x &&
      mouseX <= box.x + box.width &&
      mouseY >= box.y &&
      mouseY <= box.y + box.height;
    if (!inside) return;
    dragStateRef.current = {
      dragging: true,
      offsetX: mouseX - box.x,
      offsetY: mouseY - box.y,
    };
  };

  const handleMouseMove = (e) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !dragStateRef.current.dragging) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const box = getWatermarkBox(ctx, canvas);
    if (!box) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newX = clamp(mouseX - dragStateRef.current.offsetX, 0, canvas.width - box.width);
    const newY = clamp(mouseY - dragStateRef.current.offsetY, 0, canvas.height - box.height);

    const centerX = newX + box.width / 2;
    const centerY = newY + box.height / 2;
    setPositionPreset("custom");
    setPositionRatios({
      xRatio: clamp(centerX / canvas.width, 0, 1),
      yRatio: clamp(centerY / canvas.height, 0, 1),
    });
  };

  const handleMouseUp = () => {
    dragStateRef.current = { dragging: false, offsetX: 0, offsetY: 0 };
  };

  const handleReset = () => {
    setPositionPreset("center");
    setPositionRatios({ xRatio: 0.5, yRatio: 0.5 });
    setWatermarkType("text");
    setWatermarkText("CONFIDENTIAL");
    setFontSize(48);
    setFontFamily("Helvetica");
    setFontColor("#666666");
    setBold(false);
    setItalic(false);
    setOpacity(0.3);
    setRotation(-45);
    setImageScale(0.3);
    setImageFile(null);
    setPageScope("all");
  };

  const handleApplyWatermark = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please select a PDF file" });
      return;
    }

    if (watermarkType === "text" && !watermarkText.trim()) {
      setResult({ success: false, error: "Please enter watermark text" });
      return;
    }

    if (watermarkType === "image" && !imageFile) {
      setResult({ success: false, error: "Please upload a watermark image" });
      return;
    }

    setLoading(true);
    try {
      const response = await watermarkPdf(
        pdfFile,
        watermarkType === "text" ? watermarkText.trim() : undefined,
        positionPreset === "custom" ? "center" : positionPreset,
        opacity,
        fontSize,
        null,
        {
          type: watermarkType,
          watermarkImage: imageFile || undefined,
          xRatio,
          yRatio,
          scale: imageScale,
          rotation,
          pageScope,
          pageNumber: pageScope === "current" ? pageNumber : undefined,
          fontFamily,
          fontColor,
          bold,
          italic,
        }
      );
      setResultBlob(response.data);
      setResult({ success: true, fileName: "watermarked.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-2">Watermark PDF</h3>
      <p className="text-sm text-gray-600 mb-4">
        Preview and position your watermark before applying.
      </p>

      {pdfFile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Watermark Type</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setWatermarkType("text")}
                  className={`flex-1 py-2 rounded font-medium border ${
                    watermarkType === "text"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setWatermarkType("image")}
                  className={`flex-1 py-2 rounded font-medium border ${
                    watermarkType === "image"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Image
                </button>
              </div>
            </div>

            {watermarkType === "text" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="CONFIDENTIAL"
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                    <input
                      type="number"
                      min="8"
                      max="200"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 48)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    >
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Font Color</label>
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-full h-10 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={bold}
                        onChange={(e) => setBold(e.target.checked)}
                      />
                      Bold
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={italic}
                        onChange={(e) => setItalic(e.target.checked)}
                      />
                      Italic
                    </label>
                  </div>
                </div>
              </div>
            )}

            {watermarkType === "image" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  {imageFile && (
                    <p className="text-xs text-green-600 mt-2">✓ {imageFile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scale: {imageScale.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.01"
                    value={imageScale}
                    onChange={(e) => setImageScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity: {opacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotation: {rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10) || 0)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Position Presets</p>
              <div className="grid grid-cols-3 gap-2">
                {POSITION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePositionPreset(preset)}
                    className={`py-2 text-xs rounded border ${
                      positionPreset === preset
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    {preset.replace("-", " ")}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: Drag the watermark on the preview to fine-tune.</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Apply To</p>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="pageScope"
                    value="all"
                    checked={pageScope === "all"}
                    onChange={(e) => setPageScope(e.target.value)}
                  />
                  All pages
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="pageScope"
                    value="current"
                    checked={pageScope === "current"}
                    onChange={(e) => setPageScope(e.target.value)}
                  />
                  Current page
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 border border-gray-300 py-3 rounded font-semibold text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleApplyWatermark}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Apply Watermark"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Preview</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageNumber((prev) => clamp(prev - 1, 1, pageCount))}
                  disabled={pageNumber <= 1}
                  className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {pageNumber} / {pageCount}
                </span>
                <button
                  onClick={() => setPageNumber((prev) => clamp(prev + 1, 1, pageCount))}
                  disabled={pageNumber >= pageCount}
                  className="px-2 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 relative overflow-auto"
              style={{ minHeight: "400px", maxHeight: "520px" }}
            >
              <div className="relative inline-block">
                <canvas ref={pdfCanvasRef} className="block" />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute top-0 left-0 cursor-move"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to add watermark</p>
        </div>
      )}
    </>
  );
}
