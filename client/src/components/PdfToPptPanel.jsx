import { useState } from "react";
import { convertFile, getErrorMessage } from "../api";
import FileUpload from "./FileUpload";
import LoadingSpinner from "./LoadingSpinner";
import ResultPreview from "./ResultPreview";

export default function PdfToPptPanel() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);

  const handleFileSelect = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const validFiles = [];

    for (const file of selectedFiles) {
      const ext = file.name.split(".").pop().toLowerCase();

      if (ext !== "pdf") {
        setResult({
          success: false,
          error: "Only PDF files are allowed.",
        });
        return;
      }

      validFiles.push(file);
    }

    setFiles(validFiles);
    setResult(null);
  };

  const handleConvert = async () => {
    if (!files || files.length === 0) return;

    setLoading(true);

    try {
      const response = await convertFile(files, "pptx");

      setResultBlob(response.data);

      setResult({
        success: true,
        fileName:
          files.length > 1
            ? "converted-files.zip"
            : "converted.pptx",
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

  const handleDownload = () => {
    if (!resultBlob) return;

    const url = window.URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setResultBlob(null);
  };

  return (
    <div className="space-y-6">

      {files.length === 0 && !result && (
        <FileUpload
          onFileSelect={handleFileSelect}
          disabled={loading}
          multiple
        />
      )}

      {files.length > 0 && !result && (
        <button
          onClick={handleConvert}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          Convert PDF to PPT
        </button>
      )}

      {loading && (
        <LoadingSpinner message="Converting PDF to PowerPoint..." />
      )}

      {result && (
        <ResultPreview
          success={result.success}
          error={result.error}
          fileName={result.fileName}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
