import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { editPdf, getErrorMessage } from "../api";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PREVIEW_SCALE = 1.5;
const THUMB_SCALE = 0.18;

export default function EditPdfPanel({
  pdfFile,
  setResult,
  setResultBlob,
  setLoading,
  loading,
}) {
  // PDF state
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [thumbnails, setThumbnails] = useState({});

  // Extracted text from PDF
  const [extractedTexts, setExtractedTexts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [modifications, setModifications] = useState({});

  // Add-text mode
  const [mode, setMode] = useState("edit"); // "edit" | "add"
  const [addedTexts, setAddedTexts] = useState([]);
  const [activeInput, setActiveInput] = useState(null);

  // Formatting
  const [fontSize, setFontSize] = useState(14);
  const [fontColor, setFontColor] = useState("#000000");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  // History
  const [history, setHistory] = useState([]);

  // Refs
  const pdfCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const renderTaskRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const editInputRef = useRef(null);

  // ============================================================
  // Load PDF
  // ============================================================
  useEffect(() => {
    if (!pdfFile) {
      setPdfDoc(null);
      setPageCount(0);
      setThumbnails({});
      setExtractedTexts([]);
      setModifications({});
      setAddedTexts([]);
      setCurrentPage(1);
      return;
    }

    let cancelled = false;

    const loadPdf = async () => {
      const buffer = await pdfFile.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
      if (cancelled) return;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setCurrentPage(1);
      setExtractedTexts([]);
      setModifications({});
      setAddedTexts([]);
      setHistory([]);
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [pdfFile]);

  // ============================================================
  // Render Thumbnails
  // ============================================================
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
    return () => { cancelled = true; };
  }, [pdfDoc, pageCount]);

  // ============================================================
  // Render Current Page
  // ============================================================
  useEffect(() => {
    if (!pdfDoc || !pdfCanvasRef.current) return;
    let cancelled = false;

    const renderPage = async () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { }
      }

      const page = await pdfDoc.getPage(currentPage);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: PREVIEW_SCALE });
      const canvas = pdfCanvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPageSize({ width: viewport.width, height: viewport.height });

      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
    };

    renderPage();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch { }
      }
    };
  }, [pdfDoc, currentPage]);

  // ============================================================
  // Extract Text from All Pages
  // ============================================================
  useEffect(() => {
    if (!pdfDoc || pageCount === 0) return;
    let cancelled = false;

    const extractText = async () => {
      const allTexts = [];

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        if (cancelled) return;
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        const content = await page.getTextContent();
        const items = content.items || [];

        items.forEach((item, idx) => {
          const str = item.str || "";
          if (!str.trim()) return; // skip whitespace-only items

          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const x = tx[4];
          const fontHeight = Math.hypot(tx[2], tx[3]);
          const y = tx[5] - fontHeight;
          const width = item.width * viewport.scale;

          allTexts.push({
            id: `ext-${pageNum}-${idx}`,
            pageNumber: pageNum,
            text: str,
            originalText: str,
            x,
            y,
            width: Math.max(width, 20),
            height: fontHeight,
            fontSize: Math.round(fontHeight / PREVIEW_SCALE),
            fontName: item.fontName || "Helvetica",
          });
        });
      }

      if (!cancelled) setExtractedTexts(allTexts);
    };

    extractText();
    return () => { cancelled = true; };
  }, [pdfDoc, pageCount]);

  // ============================================================
  // Focus edit input when editing starts
  // ============================================================
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ============================================================
  // Helpers
  // ============================================================
  const currentPageTexts = useMemo(
    () => extractedTexts.filter((t) => t.pageNumber === currentPage),
    [extractedTexts, currentPage]
  );

  const currentPageAdded = useMemo(
    () => addedTexts.filter((t) => t.pageNumber === currentPage),
    [addedTexts, currentPage]
  );

  const modifiedCount = useMemo(
    () => Object.keys(modifications).length,
    [modifications]
  );

  const totalEdits = useMemo(
    () => modifiedCount + addedTexts.length,
    [modifiedCount, addedTexts]
  );

  const getDisplayText = useCallback(
    (item) => {
      if (modifications[item.id] !== undefined) {
        return modifications[item.id];
      }
      return item.text;
    },
    [modifications]
  );

  const isModified = useCallback(
    (item) => {
      return (
        modifications[item.id] !== undefined &&
        modifications[item.id] !== item.originalText
      );
    },
    [modifications]
  );

  // ============================================================
  // Push to undo history
  // ============================================================
  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-29), // keep last 30
      { modifications: { ...modifications }, addedTexts: [...addedTexts] },
    ]);
  }, [modifications, addedTexts]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setModifications(last.modifications);
      setAddedTexts(last.addedTexts);
      return prev.slice(0, -1);
    });
  }, []);

  // ============================================================
  // Inline Edit Handlers
  // ============================================================
  const handleTextClick = useCallback(
    (item) => {
      if (mode !== "edit") return;
      setEditingId(item.id);
    },
    [mode]
  );

  const handleEditChange = useCallback(
    (id, newText) => {
      setModifications((prev) => ({ ...prev, [id]: newText }));
    },
    []
  );

  const handleEditConfirm = useCallback(() => {
    if (editingId) {
      pushHistory();
    }
    setEditingId(null);
  }, [editingId, pushHistory]);

  const handleEditKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleEditConfirm();
      } else if (e.key === "Escape") {
        // Revert this edit
        setModifications((prev) => {
          const next = { ...prev };
          delete next[editingId];
          return next;
        });
        setEditingId(null);
      }
    },
    [editingId, handleEditConfirm]
  );

  // ============================================================
  // Add Text Handlers
  // ============================================================
  const handleCanvasClick = useCallback(
    (e) => {
      if (mode !== "add" || !overlayRef.current) return;
      // Don't add text if clicking on existing elements
      if (e.target !== e.currentTarget) return;

      const rect = overlayRef.current.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / pageSize.width;
      const yRatio = (e.clientY - rect.top) / pageSize.height;

      setActiveInput({ xRatio, yRatio, value: "" });
    },
    [mode, pageSize]
  );

  const confirmAddInput = useCallback(() => {
    if (!activeInput?.value.trim()) {
      setActiveInput(null);
      return;
    }

    pushHistory();

    setAddedTexts((prev) => [
      ...prev,
      {
        id: `add-${Date.now()}-${Math.random()}`,
        type: "addText",
        text: activeInput.value,
        xRatio: activeInput.xRatio,
        yRatio: activeInput.yRatio,
        fontSize,
        color: fontColor,
        bold,
        italic,
        opacity: 1,
        pageNumber: currentPage,
      },
    ]);
    setActiveInput(null);
  }, [activeInput, fontSize, fontColor, bold, italic, currentPage, pushHistory]);

  // ============================================================
  // Delete added text
  // ============================================================
  const deleteAddedText = useCallback(
    (id) => {
      pushHistory();
      setAddedTexts((prev) => prev.filter((t) => t.id !== id));
    },
    [pushHistory]
  );

  // ============================================================
  // Save PDF
  // ============================================================
  const handleSave = async () => {
    if (!pdfFile) return;
    setLoading(true);

    try {
      const elements = [];

      // Collect text replacements
      Object.entries(modifications).forEach(([id, newText]) => {
        const original = extractedTexts.find((t) => t.id === id);
        if (!original || newText === original.originalText) return;

        elements.push({
          type: "replaceText",
          pageNumber: original.pageNumber,
          text: newText,
          x: original.x / PREVIEW_SCALE,
          y: original.y / PREVIEW_SCALE,
          width: original.width / PREVIEW_SCALE,
          height: original.height / PREVIEW_SCALE,
          fontSize: original.fontSize,
          color: fontColor,
          bold: false,
          italic: false,
          opacity: 1,
          // Pass ratio-based coordinates for the whiteout box
          xRatio: original.x / pageSize.width,
          yRatio: original.y / pageSize.height,
          boxWidth: (original.width / pageSize.width) * 1000, // scaled for server
          boxHeight: (original.height / pageSize.height) * 1000,
        });
      });

      // Collect added texts
      addedTexts.forEach((t) => {
        elements.push({
          type: "replaceText",
          pageNumber: t.pageNumber,
          text: t.text,
          xRatio: t.xRatio,
          yRatio: t.yRatio,
          fontSize: t.fontSize,
          color: t.color,
          bold: t.bold,
          italic: t.italic,
          opacity: t.opacity ?? 1,
          boxWidth: 0,
          boxHeight: 0,
        });
      });

      if (elements.length === 0) {
        setResult({ success: false, error: "No edits to save" });
        setLoading(false);
        return;
      }

      const response = await editPdf(pdfFile, elements);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "edited.pdf" });
    } catch (err) {
      setResult({ success: false, error: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Clear All
  // ============================================================
  const handleClearAll = useCallback(() => {
    pushHistory();
    setModifications({});
    setAddedTexts([]);
    setEditingId(null);
    setActiveInput(null);
  }, [pushHistory]);

  // ============================================================
  // Render
  // ============================================================
  if (!pdfFile) {
    return (
      <div className="bg-blue-50 p-8 rounded-lg text-center text-blue-800">
        <p className="text-lg">Upload a PDF file above to start editing</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ============ TOOLBAR ============ */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
        {/* Mode Toggle */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          <button
            onClick={() => { setMode("edit"); setActiveInput(null); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${mode === "edit"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            ✏️ Edit Text
          </button>
          <button
            onClick={() => { setMode("add"); setEditingId(null); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${mode === "add"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            ➕ Add Text
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300" />

        {/* Font Size */}
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">Size</label>
          <input
            type="number"
            min={6}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>

        {/* Color */}
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">Color</label>
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        {/* Bold / Italic */}
        <button
          onClick={() => setBold(!bold)}
          className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-bold ${bold ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-300 text-gray-600"
            }`}
        >
          B
        </button>
        <button
          onClick={() => setItalic(!italic)}
          className={`w-8 h-8 flex items-center justify-center rounded border text-sm italic ${italic ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-300 text-gray-600"
            }`}
        >
          I
        </button>

        <div className="w-px h-8 bg-gray-300" />

        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Undo"
        >
          ↩️ Undo
        </button>

        {/* Clear All */}
        <button
          onClick={handleClearAll}
          disabled={totalEdits === 0}
          className="px-3 py-2 text-sm border border-gray-300 rounded text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          🗑️ Clear All
        </button>

        <div className="flex-1" />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={loading || totalEdits === 0}
          className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving..." : "💾 Save PDF"}
        </button>
      </div>

      {/* ============ MAIN LAYOUT ============ */}
      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: Thumbnails */}
        <div className="col-span-12 lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">Pages</p>
            <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
              {Array.from({ length: pageCount }, (_, i) => i).map((idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-full border rounded p-1 text-left transition-colors ${currentPage === idx + 1
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                    }`}
                >
                  {thumbnails[idx] ? (
                    <img
                      src={thumbnails[idx]}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="bg-gray-100 h-28 flex items-center justify-center text-xs text-gray-400">
                      Loading...
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-1 text-center">
                    Page {idx + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: PDF Preview with Editable Overlays */}
        <div className="col-span-12 lg:col-span-7">
          <div
            ref={scrollContainerRef}
            className="bg-gray-100 border border-gray-200 rounded-lg p-4 overflow-auto"
            style={{ maxHeight: "75vh" }}
          >
            <div className="relative inline-block mx-auto">
              <canvas ref={pdfCanvasRef} className="block border border-gray-300 shadow-sm" />

              {/* Editable Overlay Layer */}
              <div
                ref={overlayRef}
                className="absolute inset-0"
                onClick={handleCanvasClick}
                style={{ cursor: mode === "add" ? "text" : "default" }}
              >
                {/* Extracted text spans (inline editable) */}
                {currentPageTexts.map((item) => {
                  const displayText = getDisplayText(item);
                  const modified = isModified(item);
                  const isEditing = editingId === item.id;

                  if (isEditing) {
                    return (
                      <input
                        key={item.id}
                        ref={editInputRef}
                        value={modifications[item.id] ?? item.text}
                        onChange={(e) => handleEditChange(item.id, e.target.value)}
                        onBlur={handleEditConfirm}
                        onKeyDown={handleEditKeyDown}
                        className="absolute border-2 border-blue-500 bg-white/95 outline-none px-0.5"
                        style={{
                          left: item.x,
                          top: item.y,
                          minWidth: Math.max(item.width, 40),
                          height: item.height + 4,
                          fontSize: item.height * 0.85,
                          lineHeight: `${item.height}px`,
                          fontFamily: "Helvetica, Arial, sans-serif",
                          color: fontColor,
                          zIndex: 20,
                        }}
                      />
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextClick(item);
                      }}
                      className={`absolute transition-all ${mode === "edit"
                        ? "cursor-text hover:bg-blue-100/40 hover:outline hover:outline-1 hover:outline-blue-400"
                        : "pointer-events-none"
                        } ${modified
                          ? "bg-yellow-100/60 outline outline-1 outline-yellow-500"
                          : ""
                        }`}
                      style={{
                        left: item.x,
                        top: item.y,
                        width: modified ? "auto" : item.width,
                        minWidth: item.width,
                        height: item.height,
                        fontSize: item.height * 0.85,
                        lineHeight: `${item.height}px`,
                        fontFamily: "Helvetica, Arial, sans-serif",
                        color: "transparent",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                        zIndex: 10,
                      }}
                      title={
                        mode === "edit"
                          ? `Click to edit: "${displayText}"`
                          : displayText
                      }
                    >
                      {displayText}
                    </div>
                  );
                })}

                {/* Added text elements */}
                {currentPageAdded.map((el) => {
                  const x = el.xRatio * pageSize.width;
                  const y = el.yRatio * pageSize.height;
                  return (
                    <div
                      key={el.id}
                      className="absolute group"
                      style={{
                        left: x,
                        top: y,
                        fontSize: el.fontSize,
                        color: el.color,
                        fontWeight: el.bold ? "bold" : "normal",
                        fontStyle: el.italic ? "italic" : "normal",
                        fontFamily: "Helvetica, Arial, sans-serif",
                        zIndex: 15,
                        cursor: "default",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                        background: "rgba(200, 230, 255, 0.4)",
                        outline: "1px dashed #3b82f6",
                        padding: "0 2px",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {el.text}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAddedText(el.id);
                        }}
                        className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 text-white rounded-full text-xs
                                   flex items-center justify-center opacity-0 group-hover:opacity-100
                                   transition-opacity shadow-sm hover:bg-red-600"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}

                {/* Active add-text input */}
                {activeInput && (
                  <input
                    autoFocus
                    value={activeInput.value}
                    onChange={(e) =>
                      setActiveInput({ ...activeInput, value: e.target.value })
                    }
                    onBlur={confirmAddInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmAddInput();
                      if (e.key === "Escape") setActiveInput(null);
                    }}
                    className="absolute border-2 border-blue-500 bg-white/90 outline-none px-1 py-0.5 shadow-lg"
                    style={{
                      left: activeInput.xRatio * pageSize.width,
                      top: activeInput.yRatio * pageSize.height,
                      fontSize,
                      fontWeight: bold ? "bold" : "normal",
                      fontStyle: italic ? "italic" : "normal",
                      color: fontColor,
                      zIndex: 30,
                      minWidth: 100,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Page Navigation */}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600 font-medium">
                Page {currentPage} of {pageCount}
              </span>
              <button
                disabled={currentPage === pageCount}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Edits Summary Panel */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4 space-y-4">
            {/* Mode Info */}
            <div className={`p-3 rounded-lg text-sm ${mode === "edit"
              ? "bg-blue-50 border border-blue-200 text-blue-800"
              : "bg-green-50 border border-green-200 text-green-800"
              }`}>
              {mode === "edit" ? (
                <>
                  <strong>✏️ Edit Mode</strong>
                  <p className="mt-1 text-xs opacity-80">
                    Click on any text in the PDF to edit it inline. Press Enter to confirm, Escape to cancel.
                  </p>
                </>
              ) : (
                <>
                  <strong>➕ Add Mode</strong>
                  <p className="mt-1 text-xs opacity-80">
                    Click anywhere on the PDF to add new text. Set font size and color above.
                  </p>
                </>
              )}
            </div>

            {/* Edits Count */}
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Edits Summary</p>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Text modifications</span>
                <span className="font-semibold">{modifiedCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                <span>Added text</span>
                <span className="font-semibold">{addedTexts.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-800 mt-2 pt-2 border-t border-gray-100 font-semibold">
                <span>Total edits</span>
                <span>{totalEdits}</span>
              </div>
            </div>

            {/* Modifications List */}
            {modifiedCount > 0 && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Modified Text</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {Object.entries(modifications)
                    .filter(([id, newText]) => {
                      const orig = extractedTexts.find((t) => t.id === id);
                      return orig && newText !== orig.originalText;
                    })
                    .map(([id, newText]) => {
                      const orig = extractedTexts.find((t) => t.id === id);
                      return (
                        <div
                          key={id}
                          className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs"
                        >
                          <div className="text-gray-500 line-through">
                            {orig.originalText}
                          </div>
                          <div className="text-gray-800 font-medium mt-0.5">
                            → {newText || "(deleted)"}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Page {orig.pageNumber}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Added texts list */}
            {addedTexts.length > 0 && (
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Added Text</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {addedTexts.map((t) => (
                    <div
                      key={t.id}
                      className="bg-blue-50 border border-blue-200 rounded p-2 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="text-gray-800">{t.text}</span>
                        <span className="text-[10px] text-gray-400 ml-1">
                          (Page {t.pageNumber})
                        </span>
                      </div>
                      <button
                        onClick={() => deleteAddedText(t.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted texts count */}
            <div className="border-t border-gray-200 pt-3 text-xs text-gray-500">
              <p>{extractedTexts.length} text elements detected in PDF</p>
              <p className="mt-1">
                {currentPageTexts.length} on current page
              </p>
            </div>

            {/* Tip */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-xs text-amber-800">
              <strong>💡 Tip:</strong> Modified text is highlighted in yellow on the PDF preview. Hover over text spans to see what's editable.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}