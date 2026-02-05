import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { organizePdf, getErrorMessage } from "../api";

export default function OrganizePdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [totalPages, setTotalPages] = useState(0);
  const [organizePages, setOrganizePages] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [pagesToRemoveInput, setPagesToRemoveInput] = useState("");
  const [mode, setMode] = useState("reorder"); // "reorder" or "remove"

  useEffect(() => {
    const loadPageCount = async () => {
      if (!pdfFile) {
        setTotalPages(0);
        return;
      }
      try {
        const buffer = await pdfFile.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        setTotalPages(doc.getPageCount());
      } catch {
        setTotalPages(0);
      }
    };
    loadPageCount();
  }, [pdfFile]);

  useEffect(() => {
    if (Number.isInteger(totalPages) && totalPages > 0) {
      setOrganizePages(Array.from({ length: totalPages }, (_, i) => i + 1));
    } else {
      setOrganizePages([]);
    }
  }, [totalPages]);

  const handleOrganizeReorder = async () => {
    if (!pdfFile || organizePages.length === 0) {
      setResult({ success: false, error: "Please wait for pages to load" });
      return;
    }

    setLoading(true);
    try {
      const response = await organizePdf(pdfFile, { pageOrder: organizePages });
      setResultBlob(response.data);
      setResult({ success: true, fileName: "organized.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizeRemove = async () => {
    if (!pdfFile || !pagesToRemoveInput.trim()) {
      setResult({ success: false, error: "Please enter pages to remove (e.g., 1,3,5-7)" });
      return;
    }

    setLoading(true);
    try {
      const response = await organizePdf(pdfFile, { pagesToRemove: pagesToRemoveInput.trim() });
      setResultBlob(response.data);
      setResult({ success: true, fileName: "organized.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (index) => setDragIndex(index);

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const updated = [...organizePages];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(index, 0, moved);
    setOrganizePages(updated);
    setDragIndex(null);
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Organize PDF</h3>
      
      {pdfFile && (
        <>
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setMode("reorder")}
              className={`flex-1 py-2 rounded font-medium ${
                mode === "reorder" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Reorder Pages
            </button>
            <button
              onClick={() => setMode("remove")}
              className={`flex-1 py-2 rounded font-medium ${
                mode === "remove" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              Remove Pages
            </button>
          </div>

          {mode === "reorder" && (
            <>
              <p className="text-sm text-gray-600 mb-2">Total Pages: {totalPages}</p>
              <div className="mb-4 border border-gray-300 rounded p-3 max-h-64 overflow-y-auto">
                {organizePages.map((page, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                    className="p-2 mb-1 bg-gray-100 rounded cursor-move hover:bg-gray-200 flex items-center"
                  >
                    <span className="font-mono">Page {page}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleOrganizeReorder}
                disabled={loading || organizePages.length === 0}
                className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Apply Reordering"}
              </button>
            </>
          )}

          {mode === "remove" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pages to Remove (e.g., 1,3,5-7)
                </label>
                <input
                  type="text"
                  value={pagesToRemoveInput}
                  onChange={(e) => setPagesToRemoveInput(e.target.value)}
                  placeholder="1,3,5-7"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={handleOrganizeRemove}
                disabled={loading || !pagesToRemoveInput.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Remove Pages"}
              </button>
            </>
          )}
        </>
      )}

      {!pdfFile && (
        <div className="bg-blue-50 p-4 rounded text-center text-blue-800">
          <p>Upload a PDF file above to organize pages</p>
        </div>
      )}
    </>
  );
}
