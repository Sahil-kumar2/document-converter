import React, { useState, useEffect } from "react";
import { mergePdfs, getErrorMessage } from "../api";

export default function MergePdfPanel({ pdfFile, loading, setLoading, setResult, setResultBlob }) {
  const [mergePdfFiles, setMergePdfFiles] = useState([]);

  useEffect(() => {
    if (pdfFile) {
      const addUniqueFiles = (prevFiles, newFiles) => {
        const map = new Map();
        prevFiles.forEach((file) => {
          map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
        });
        newFiles.forEach((file) => {
          map.set(`${file.name}-${file.size}-${file.lastModified}`, file);
        });
        return Array.from(map.values());
      };
      setMergePdfFiles((prev) => addUniqueFiles(prev, [pdfFile]));
    }
  }, [pdfFile]);

  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length !== files.length) {
      setResult({ success: false, error: "Some files were not PDFs and were skipped" });
    }
    setMergePdfFiles((prev) => [...prev, ...pdfFiles]);
  };

  const handleRemoveFile = (index) => {
    setMergePdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (mergePdfFiles.length < 2) {
      setResult({ success: false, error: "Please select at least 2 PDF files to merge" });
      return;
    }

    setLoading(true);
    try {
      const response = await mergePdfs(mergePdfFiles);
      setResultBlob(response.data);
      setResult({ success: true, fileName: "merged.pdf" });
    } catch (error) {
      setResult({ success: false, error: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h3 className="font-semibold text-gray-900 mb-4">Merge PDFs</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add More PDFs</label>
        <input
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleAddFiles}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      {mergePdfFiles.length > 0 && (
        <div className="mb-4 border border-gray-300 rounded p-3 max-h-48 overflow-y-auto">
          {mergePdfFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 mb-1 bg-gray-100 rounded">
              <span className="text-sm truncate flex-1">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-4">Files to merge: {mergePdfFiles.length}</p>

      <button
        onClick={handleMerge}
        disabled={loading || mergePdfFiles.length < 2}
        className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Merging..." : `Merge ${mergePdfFiles.length} PDFs`}
      </button>

      {mergePdfFiles.length < 2 && (
        <div className="mt-3 bg-yellow-50 p-3 rounded text-sm text-yellow-800">
          Please add at least 2 PDF files to merge
        </div>
      )}
    </>
  );
}
