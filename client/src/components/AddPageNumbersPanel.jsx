import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { addPageNumbers, getErrorMessage } from "../api";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PREVIEW_SCALE = 1.25;
const THUMB_SCALE = 0.18;

export default function AddPageNumbersPanel({
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

  // Options state
  const [pageMode, setPageMode] = useState("single"); // "single" | "facing"
  const [position, setPosition] = useState("bottom-right"); // "top-left", "top-center", etc.
  const [margin, setMargin] = useState("medium"); // "recommended", "small", "medium", "large"
  const [startPage, setStartPage] = useState("1");
  const [endPage, setEndPage] = useState("");
  const [textContent, setTextContent] = useState("page-number"); // "page-number", "page-of-total", "custom"
  const [customText, setCustomText] = useState("Page {page}");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("12");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textColor, setTextColor] = useState("#000000");

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef([]);
  const canvasRefs = useRef([]);
  const overlayCanvasRefs = useRef([]);

  // Load PDF
  useEffect(() => {
    if (!pdfFile) {
      setPdfDoc(null);
      setPageCount(0);
      setThumbnails({});
      setActivePage(0);
      setEndPage("");
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
      setEndPage(doc.numPages.toString());
    };

    loadPdf();

    return () => {
      cancelled = true;
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

  // Render main preview pages
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

  // Draw page numbers on overlay canvas
  useEffect(() => {
    if (!pdfDoc || pageCount === 0) return;
    let cancelled = false;

    const renderPageNumbers = async () => {
      for (let i = 0; i < pageCount; i++) {
        if (cancelled) return;
        const overlayCanvas = overlayCanvasRefs.current[i];
        if (!overlayCanvas) continue;

        const page = await pdfDoc.getPage(i + 1);
        const viewport = page.getViewport({ scale: PREVIEW_SCALE });

        overlayCanvas.width = viewport.width;
        overlayCanvas.height = viewport.height;

        const ctx = overlayCanvas.getContext("2d");
        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        // Check if this page should have a number
        const pageNum = i + 1;
        const startNum = parseInt(startPage, 10) || 1;
        const endNum = parseInt(endPage, 10) || pageCount;

        if (pageNum < startNum || pageNum > endNum) {
          continue;
        }

        // Generate page number text
        let pageText = "";
        if (textContent === "page-number") {
          pageText = pageNum.toString();
        } else if (textContent === "page-of-total") {
          pageText = `${pageNum} of ${pageCount}`;
        } else if (textContent === "custom") {
          pageText = customText.replace(/{page}/g, pageNum).replace(/{total}/g, pageCount);
        }

        // Set text properties
        const fontSize_num = parseInt(fontSize, 10) || 12;
        const fontStyle = `${bold ? "bold " : ""}${italic ? "italic " : ""}${fontSize_num}px ${fontFamily}`;
        ctx.font = fontStyle;
        ctx.fillStyle = textColor;
        ctx.textBaseline = "middle";

        // Measure text
        const metrics = ctx.measureText(pageText);
        const textWidth = metrics.width;
        const textHeight = fontSize_num;

        // Calculate position based on selected position and margins
        const marginPixels = getMarginPixels(margin, viewport.width, viewport.height);
        let x, y;

        const [vPos, hPos] = position.split("-"); // e.g., "bottom-right" -> ["bottom", "right"]

        // Vertical position
        if (vPos === "top") {
          y = marginPixels + textHeight / 2;
        } else if (vPos === "middle") {
          y = viewport.height / 2;
        } else {
          // bottom
          y = viewport.height - marginPixels - textHeight / 2;
        }

        // Horizontal position
        if (hPos === "left") {
          x = marginPixels;
        } else if (hPos === "center") {
          x = viewport.width / 2 - textWidth / 2;
        } else {
          // right
          x = viewport.width - marginPixels - textWidth;
        }

        ctx.fillText(pageText, x, y);
      }
    };

    renderPageNumbers();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageCount, position, margin, startPage, endPage, textContent, customText, fontFamily, fontSize, bold, italic, underline, textColor]);

  const getMarginPixels = (marginType, width, height) => {
    const baseFontSize = parseInt(fontSize, 10) || 12;
    const margins = {
      recommended: baseFontSize * 1.5,
      small: baseFontSize * 0.5,
      medium: baseFontSize * 1,
      large: baseFontSize * 2.5,
    };
    return margins[marginType] || margins.medium;
  };

  const scrollToPage = (pageIndex) => {
    const target = pageRefs.current[pageIndex];
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActivePage(pageIndex);
    }
  };

  const handleAddPageNumbers = async () => {
    if (!pdfFile || !pdfDoc) {
      setResult({
        success: false,
        error: "Please upload a PDF first",
      });
      return;
    }

    setLoading(true);
    try {
      const startNum = parseInt(startPage, 10) || 1;
      const endNum = parseInt(endPage, 10) || pageCount;

      if (startNum < 1 || endNum > pageCount || startNum > endNum) {
        throw new Error("Invalid page range");
      }

      let pageNumberText = "";
      if (textContent === "page-number") {
        pageNumberText = "{page}";
      } else if (textContent === "page-of-total") {
        pageNumberText = "{page} of {total}";
      } else if (textContent === "custom") {
        pageNumberText = customText;
      }

      const response = await addPageNumbers(pdfFile, {
        position,
        margin,
        startPage: startNum,
        endPage: endNum,
        textContent: pageNumberText,
        fontFamily,
        fontSize: parseInt(fontSize, 10) || 12,
        bold,
        italic,
        underline,
        textColor,
        pageMode,
      });

      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: `numbered-${pdfFile.name}`,
      });
    } catch (err) {
      setResult({
        success: false,
        error: getErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  // Position grid selector
  const PositionGrid = () => {
    const positions = [
      ["top-left", "top-center", "top-right"],
      ["middle-left", "middle-center", "middle-right"],
      ["bottom-left", "bottom-center", "bottom-right"],
    ];

    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-2">
          {positions.flat().map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={`p-3 rounded border-2 transition ${
                position === pos
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
              title={pos}
            >
              <div className="text-xs font-bold text-gray-700">{pos}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4 min-h-screen bg-gray-100">
      {/* Left: PDF Preview Grid (iLovePDF style) */}
      <div className="flex-1 overflow-auto max-h-screen bg-gray-100 p-4">
        <div
          className="grid grid-cols-2 lg:grid-cols-3 gap-4"
          ref={scrollContainerRef}
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <div
              key={i}
              ref={(el) => {
                pageRefs.current[i] = el;
              }}
              className={`relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition hover:shadow-lg ${
                activePage === i ? "ring-2 ring-red-500" : ""
              }`}
              onClick={() => scrollToPage(i)}
            >
              {/* Main canvas */}
              <canvas
                ref={(el) => {
                  canvasRefs.current[i] = el;
                }}
                className="w-full h-auto block"
              />

              {/* Overlay canvas for page numbers */}
              <canvas
                ref={(el) => {
                  overlayCanvasRefs.current[i] = el;
                }}
                className="absolute top-0 left-0 w-full h-full"
              />

              <div className="text-center py-1 bg-gray-50 text-xs text-gray-600">
                Page {i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Options Panel (Sticky - iLovePDF style) */}
      <div className="w-96 sticky top-0 h-screen overflow-y-auto bg-white shadow-lg p-6 border-l border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Page Number Options</h3>

        {/* Page Mode */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            📖 Page Mode
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pageMode"
                value="single"
                checked={pageMode === "single"}
                onChange={(e) => setPageMode(e.target.value)}
              />
              <span className="text-gray-700">Single page</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pageMode"
                value="facing"
                checked={pageMode === "facing"}
                onChange={(e) => setPageMode(e.target.value)}
              />
              <span className="text-gray-700">Facing pages</span>
            </label>
          </div>
        </div>

        {/* Position Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            📍 Position
          </label>
          <PositionGrid />
        </div>

        {/* Margin */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            📏 Margin
          </label>
          <select
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="recommended">Recommended</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        {/* Pages Range */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            📄 Pages Range
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-600">From</label>
              <input
                type="number"
                min="1"
                max={pageCount}
                value={startPage}
                onChange={(e) => setStartPage(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600">To</label>
              <input
                type="number"
                min="1"
                max={pageCount}
                value={endPage}
                onChange={(e) => setEndPage(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            📝 Text Content
          </label>
          <select
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          >
            <option value="page-number">Insert only page number</option>
            <option value="page-of-total">Page X of Y</option>
            <option value="custom">Custom text with page number</option>
          </select>

          {textContent === "custom" && (
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g., Page {page}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}
          <p className="text-xs text-gray-500 mt-2">
            Use {"{page}"} for page number, {"{total}"} for total pages
          </p>
        </div>

        {/* Text Formatting */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            🎨 Text Formatting
          </label>

          <div className="mb-3">
            <label className="text-xs text-gray-600">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="text-xs text-gray-600">Font Size</label>
            <input
              type="number"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setBold(!bold)}
              className={`flex-1 py-2 rounded text-sm font-bold transition ${
                bold
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              B
            </button>
            <button
              onClick={() => setItalic(!italic)}
              className={`flex-1 py-2 rounded text-sm italic transition ${
                italic
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              I
            </button>
            <button
              onClick={() => setUnderline(!underline)}
              className={`flex-1 py-2 rounded text-sm underline transition ${
                underline
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              U
            </button>
          </div>

          <div>
            <label className="text-xs text-gray-600">Text Color</label>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAddPageNumbers}
          disabled={!pdfFile || loading}
          className={`w-full py-3 rounded-lg font-bold text-white transition ${
            pdfFile && !loading
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? "Processing..." : "Add Page Numbers"}
        </button>
      </div>
    </div>
  );
}
