import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { signPdf, getErrorMessage } from "../api";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PREVIEW_SCALE = 1.5;

export default function SignPdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  // Signature type and data
  const [signatureType, setSignatureType] = useState("text"); // text | draw | image
  const [signatureText, setSignatureText] = useState("");
  const [signatureImage, setSignatureImage] = useState(null);
  const [signatureImageFile, setSignatureImageFile] = useState(null);
  
  // Text signature styling
  const [textFontSize, setTextFontSize] = useState(24);
  const [textFontFamily, setTextFontFamily] = useState("cursive");
  const [textColor, setTextColor] = useState("#000000");
  
  // Draw signature state
  const [isDrawing, setIsDrawing] = useState(false);
  const drawCanvasRef = useRef(null);
  const drawContextRef = useRef(null);
  
  // PDF preview state
  const [pdfPages, setPdfPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pdfCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  
  // Signature placement state
  const [signatureX, setSignatureX] = useState(0.5);
  const [signatureY, setSignatureY] = useState(0.5);
  const [signatureScale, setSignatureScale] = useState(0.2);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const dragStateRef = useRef({ isDragging: false, startX: 0, startY: 0 });
  const [pageNumber, setPageNumber] = useState(1);

  // Load and render PDF preview
  useEffect(() => {
    if (!pdfFile) return;

    const loadPdf = async () => {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          pages.push(i);
        }
        setPdfPages(pages);
        setPageNumber(1);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error loading PDF:", error);
        setResult({ success: false, error: "Failed to load PDF" });
      }
    };

    loadPdf();
  }, [pdfFile, setResult]);

  // Render current PDF page to canvas
  useEffect(() => {
    if (!pdfFile || !currentPage || !pdfCanvasRef.current) return;

    const renderPage = async () => {
      try {
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: PREVIEW_SCALE });
        
        const canvas = pdfCanvasRef.current;
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        setPageSize({ width: viewport.width, height: viewport.height });

        await page.render({ canvasContext: context, viewport }).promise;
      } catch (error) {
        console.error("Error rendering PDF page:", error);
      }
    };

    renderPage();
  }, [pdfFile, currentPage]);

  // Render signature on overlay canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || pageSize.width === 0) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = pageSize.width;
    canvas.height = pageSize.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate signature position and size
    const x = signatureX * pageSize.width;
    const y = signatureY * pageSize.height;
    const width = signatureScale * pageSize.width;
    const height = signatureScale * pageSize.height * 0.5;

    // Draw signature based on type
    if (signatureType === "text" && signatureText) {
      ctx.save();
      ctx.translate(x, y);
      ctx.font = `${textFontSize}px ${textFontFamily}`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(signatureText, 0, 0);
      ctx.restore();
    } else if (signatureType === "image" && signatureImage) {
      ctx.save();
      ctx.translate(x, y);
      ctx.drawImage(signatureImage, -width / 2, -height / 2, width, height);
      ctx.restore();
    } else if (signatureType === "draw" && drawCanvasRef.current) {
      // Draw the signature from draw canvas
      const drawCanvas = drawCanvasRef.current;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(width / drawCanvas.width, height / drawCanvas.height);
      ctx.translate(-drawCanvas.width / 2, -drawCanvas.height / 2);
      ctx.drawImage(drawCanvas, 0, 0);
      ctx.restore();
    }

    // Draw selection box
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x - width / 2, y - height / 2, width, height);
    ctx.restore();
  }, [signatureType, signatureText, signatureImage, textFontSize, textFontFamily, textColor, signatureScale, signatureX, signatureY, pageSize]);

  // Draw signature canvas initialization
  useEffect(() => {
    if (signatureType !== "draw" || !drawCanvasRef.current) return;

    const canvas = drawCanvasRef.current;
    canvas.width = 400;
    canvas.height = 200;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#000";
    context.lineWidth = 2;
    drawContextRef.current = context;
  }, [signatureType]);

  // Handle drawing on canvas
  const handleDrawStart = (e) => {
    const canvas = drawCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    drawContextRef.current.beginPath();
    drawContextRef.current.moveTo(x, y);
  };

  const handleDrawMove = (e) => {
    if (!isDrawing || !drawCanvasRef.current) return;
    
    const canvas = drawCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawContextRef.current.lineTo(x, y);
    drawContextRef.current.stroke();
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  const handleClearDraw = () => {
    const canvas = drawCanvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Handle signature image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignatureImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setSignatureImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle overlay canvas drag
  const handleOverlayMouseDown = (e) => {
    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      initialX: signatureX,
      initialY: signatureY,
    };
  };

  const handleOverlayMouseMove = (e) => {
    if (!dragStateRef.current.isDragging) return;

    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const deltaX = (currentX - dragStateRef.current.startX) / pageSize.width;
    const deltaY = (currentY - dragStateRef.current.startY) / pageSize.height;

    let newX = dragStateRef.current.initialX + deltaX;
    let newY = dragStateRef.current.initialY + deltaY;

    // Clamp to canvas bounds
    newX = Math.max(signatureScale / 2, Math.min(1 - signatureScale / 2, newX));
    newY = Math.max(signatureScale / 4, Math.min(1 - signatureScale / 4, newY));

    setSignatureX(newX);
    setSignatureY(newY);
  };

  const handleOverlayMouseUp = () => {
    dragStateRef.current.isDragging = false;
  };

  // Sign PDF
  const handleSign = async () => {
    if (!pdfFile) {
      setResult({ success: false, error: "Please upload a PDF" });
      return;
    }

    if (signatureType === "text" && !signatureText) {
      setResult({ success: false, error: "Please enter signature text" });
      return;
    }

    if (signatureType === "image" && !signatureImageFile) {
      setResult({ success: false, error: "Please upload a signature image" });
      return;
    }

    if (signatureType === "draw" && !drawCanvasRef.current) {
      setResult({ success: false, error: "Please draw a signature" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        signatureType,
        xRatio: signatureX,
        yRatio: signatureY,
        scale: signatureScale,
        pageNumber: pageNumber,
      };

      if (signatureType === "text") {
        payload.signatureText = signatureText;
        payload.fontSize = textFontSize;
        payload.fontFamily = textFontFamily;
        payload.color = textColor;
      } else if (signatureType === "image") {
        payload.signatureImage = signatureImageFile;
      } else if (signatureType === "draw") {
        // Convert draw canvas to data URL
        const dataUrl = drawCanvasRef.current.toDataURL("image/png");
        payload.signatureImage = dataUrl;
      }

      const response = await signPdf(pdfFile, payload);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "signed.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {pdfFile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Preview */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">PDF Preview</h3>
            <div className="relative bg-gray-100 rounded border border-gray-300 overflow-auto" style={{ maxHeight: "600px" }}>
              <canvas
                ref={pdfCanvasRef}
                className="mx-auto"
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                onMouseLeave={handleOverlayMouseUp}
                style={{ cursor: "grab" }}
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-1/2 transform -translate-x-1/2"
                style={{ cursor: "grab" }}
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                onMouseLeave={handleOverlayMouseUp}
              />
            </div>

            {/* Page Navigation */}
            {pdfPages.length > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pdfPages.length}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(pdfPages.length, currentPage + 1))}
                  disabled={currentPage === pdfPages.length}
                  className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Signature Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-gray-900">Signature</h3>

            {/* Signature Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
              <select
                value={signatureType}
                onChange={(e) => setSignatureType(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="text">Type</option>
                <option value="draw">Draw</option>
                <option value="image">Upload</option>
              </select>
            </div>

            {/* Text Signature */}
            {signatureType === "text" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type your name"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <div>
                  <label className="text-xs font-medium text-gray-700">Font Size: {textFontSize}px</label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={textFontSize}
                    onChange={(e) => setTextFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font</label>
                  <select
                    value={textFontFamily}
                    onChange={(e) => setTextFontFamily(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="cursive">Cursive</option>
                    <option value="serif">Serif</option>
                    <option value="sans-serif">Sans Serif</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            {/* Draw Signature */}
            {signatureType === "draw" && (
              <div className="space-y-2">
                <canvas
                  ref={drawCanvasRef}
                  onMouseDown={handleDrawStart}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleDrawEnd}
                  onMouseLeave={handleDrawEnd}
                  className="w-full border border-gray-300 rounded bg-white cursor-crosshair"
                  style={{ height: "120px" }}
                />
                <button
                  onClick={handleClearDraw}
                  className="w-full px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Image Signature */}
            {signatureType === "image" && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
                {signatureImageFile && (
                  <p className="text-xs text-green-600 mt-1">✓ {signatureImageFile.name}</p>
                )}
              </div>
            )}

            {/* Scale Control */}
            <div>
              <label className="text-xs font-medium text-gray-700">Scale: {(signatureScale * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={signatureScale}
                onChange={(e) => setSignatureScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Page Number */}
            {pdfPages.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Page</label>
                <input
                  type="number"
                  min="1"
                  max={pdfPages.length}
                  value={pageNumber}
                  onChange={(e) => setPageNumber(Math.min(pdfPages.length, Math.max(1, parseInt(e.target.value))))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}

            {/* Sign Button */}
            <button
              onClick={handleSign}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? "Signing..." : "✍️ Sign PDF"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-8 rounded-lg text-center text-blue-800">
          <p className="text-lg font-medium">📄 Upload a PDF file to add a signature</p>
        </div>
      )}
    </div>
  );
}
