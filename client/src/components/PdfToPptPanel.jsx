import { useState } from "react";
import { convertFile, getErrorMessage } from "../api";
import FileUpload from "./FileUpload";
import LoadingSpinner from "./LoadingSpinner";
import ResultPreview from "./ResultPreview";

export default function PdfToPptPanel() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop().toLowerCase();

    if (ext !== "pdf") {
      setResult({
        success: false,
        error: "Only PDF files are allowed.",
      });
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const response = await convertFile(file, "pptx");

      setResultBlob(response.data);

      setResult({
        success: true,
        fileName: "converted.pptx",
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
    a.download = "converted.pptx";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setResultBlob(null);
  };

  return (
    <div className="space-y-6">

      {!file && !result && (
        <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
      )}

      {file && !result && (
        <button
          onClick={handleConvert}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
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
