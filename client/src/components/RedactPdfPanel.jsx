import React, { useState, useEffect, useRef } from "react";
import { redactPdf, getErrorMessage } from "../api";

/**
 * RedactPdfPanel - Extracted from PdfToolsPanel
 * IMPORTANT: DO NOT MODIFY - maintains pixel-perfect accuracy
 */
export default function RedactPdfPanel({
  pdfFile,
  loading,
  setLoading,
  setResult,
  setResultBlob,
}) {
  const [redactions, setRedactions] = useState([]);
  const [isDrawingRedaction, setIsDrawingRedaction] = useState(false);
  const [redactionStartPoint, setRedactionStartPoint] = useState(null);
  const [currentDrawingPoint, setCurrentDrawingPoint] = useState(null);

  const canvasRef = useRef(null);

  // Render PDF when file changes
  useEffect(() => {
    if (!pdfFile || !canvasRef.current) return;

    const renderPdf = async () => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
          GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          const pdf = await getDocument({ data: e.target.result }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = canvasRef.current;
          if (!canvas) return;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const ctx = canvas.getContext('2d');
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };
          
          await page.render(renderContext).promise;
        } catch (err) {
          console.error('Error rendering PDF:', err);
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#c00';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Error rendering PDF', canvas.width / 2, canvas.height / 2);
        }
      };
      reader.readAsArrayBuffer(pdfFile);
    };

    renderPdf();
    setRedactions([]);
  }, [pdfFile]);

  const handleRedactionMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setRedactionStartPoint({ x, y });
    setIsDrawingRedaction(true);
    setCurrentDrawingPoint(null);
  };

  const handleRedactionMouseMove = (e) => {
    if (!isDrawingRedaction || !redactionStartPoint) {
      setCurrentDrawingPoint(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / rect.width;
    const currentY = (e.clientY - rect.top) / rect.height;
    setCurrentDrawingPoint({ x: currentX, y: currentY });
  };

  const handleRedactionMouseUp = (e) => {
    if (!isDrawingRedaction || !redactionStartPoint) {
      setIsDrawingRedaction(false);
      setCurrentDrawingPoint(null);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / rect.width;
    const endY = (e.clientY - rect.top) / rect.height;

    const xRatio = Math.min(redactionStartPoint.x, endX);
    const yRatio = Math.min(redactionStartPoint.y, endY);
    const widthRatio = Math.abs(endX - redactionStartPoint.x);
    const heightRatio = Math.abs(endY - redactionStartPoint.y);

    if (widthRatio > 0.01 && heightRatio > 0.01) {
      const newRedaction = {
        pageIndex: 0,
        xRatio: Math.round(xRatio * 10000) / 10000,
        yRatio: Math.round(yRatio * 10000) / 10000,
        widthRatio: Math.round(widthRatio * 10000) / 10000,
        heightRatio: Math.round(heightRatio * 10000) / 10000,
      };
      setRedactions([...redactions, newRedaction]);
      console.log('Added redaction:', newRedaction);
    }

    setIsDrawingRedaction(false);
    setRedactionStartPoint(null);
    setCurrentDrawingPoint(null);
  };

  const handleClearRedactions = () => {
    setRedactions([]);
  };

  const handleRedact = async () => {
    if (!pdfFile) {
      setResult({
        success: false,
        error: "Please select a PDF file",
      });
      return;
    }

    if (!redactions || redactions.length === 0) {
      setResult({
        success: false,
        error: "Please draw at least one redaction box",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await redactPdf(pdfFile, redactions);
      setResultBlob(response.data);
      setResult({
        success: true,
        fileName: "redacted.pdf",
      });
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
      <h3 className="font-semibold text-gray-900 mb-4">
        Redact PDF - Draw Black Boxes
      </h3>
      
      {pdfFile && (
        <>
          <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4 relative overflow-auto" style={{ minHeight: "400px", maxHeight: "500px" }}>
            <canvas
              ref={canvasRef}
              onMouseDown={handleRedactionMouseDown}
              onMouseMove={handleRedactionMouseMove}
              onMouseUp={handleRedactionMouseUp}
              onMouseLeave={handleRedactionMouseUp}
              className="cursor-crosshair block"
              style={{ minHeight: "400px", maxWidth: "100%", height: "auto" }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
              <strong>How to use:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Click and drag on the PDF</li>
                <li>• Release to create box</li>
                <li>• Multiple boxes OK</li>
              </ul>
            </div>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <strong>Redactions:</strong>
              <p className="mt-2 text-2xl font-bold text-red-600">{redactions.length}</p>
              {redactions.length > 0 && (
                <button
                  onClick={handleClearRedactions}
                  className="mt-2 text-red-600 hover:underline text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleRedact}
            disabled={loading || redactions.length === 0}
            className="w-full bg-red-600 text-white py-3 rounded font-semibold hover:bg-red-700 disabled:opacity-50 mb-3"
          >
            {loading ? "Processing..." : `Redact PDF (${redactions.length} box${redactions.length !== 1 ? 'es' : ''})`}
          </button>
          
          <div className="bg-yellow-50 border border-yellow-300 p-3 rounded text-sm text-yellow-800">
            <strong>⚠️ Warning:</strong> Redaction is permanent. Content cannot be recovered after processing.
          </div>
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to start redacting</p>
        </div>
      )}
    </>
  );
}
