import { useState } from "react";
import { convertFile, getErrorMessage } from "./api";
import FileUpload from "./components/FileUpload";
import ConversionOptions from "./components/ConversionOptions";
import ResultPreview from "./components/ResultPreview";
import LoadingSpinner from "./components/LoadingSpinner";
import PdfToolsPanel from "./components/PdfToolsPanel";
import ImageToolsPanel from "./components/ImageToolsPanel";
import ScanToPdfPanel from "./components/ScanToPdfPanel";

export default function App() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [activeTab, setActiveTab] = useState("convert");

  const conversionRules = {
    pdf: ["docx", "xlsx", "png", "jpg", "html"],
    html: ["pdf"],
    docx: ["pdf"],
    xlsx: ["pdf"],
    ppt: ["pdf"],
    pptx: ["pdf"],
    jpg: ["png"],
    jpeg: ["png"],
    png: ["jpg"],
    webp: ["jpg", "png"],
  };

  const getFileExtension = (filename) =>
    filename.split(".").pop().toLowerCase();

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    const ext = getFileExtension(selectedFile.name);

    if (!conversionRules[ext]) {
      setResult({
        success: false,
        error: `Unsupported file type: .${ext}`,
      });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setFormat(conversionRules[ext][0]);
    setResult(null);
    setResultBlob(null);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const response = await convertFile(file, format);
      setResultBlob(response.data);
      const ext = file.name.split(".").pop().toLowerCase();

      const downloadName =
        ext === "pdf" && ["png", "jpg", "jpeg"].includes(format)
          ? "pages.zip"
          : `converted.${format}`;

      setResult({
        success: true,
        fileName: downloadName,
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
    a.style.display = "none";
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setFormat("");
    setResult(null);
    setResultBlob(null);
  };

  const ext = file ? getFileExtension(file.name) : null;
  const options = ext ? conversionRules[ext] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📄</span>
            <div>
              <h1 className="text-4xl font-extrabold">Document Converter</h1>
              <p className="text-blue-100 text-lg">
                Convert & manipulate files online with ease
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "convert", name: "🔄 Quick Convert", icon: "convert" },
            { id: "pdf", name: "🔧 PDF Tools", icon: "pdf" },
            { id: "image", name: "🖼️ Image Tools", icon: "image" },
            { id: "scan", name: "📷 Scan to PDF", icon: "scan" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Quick Convert Tab */}
        {activeTab === "convert" && (
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🚀 Quick File Converter
              </h2>
              <p className="text-gray-600">
                Convert files between different formats instantly
              </p>
            </div>

            {/* Upload Section */}
            {!file && !result && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Select your file:
                </label>
                <FileUpload
                  onFileSelect={handleFileChange}
                  disabled={loading}
                />
              </div>
            )}

            {/* Conversion Options */}
            {file && !result && (
              <div className="space-y-6">
                <ConversionOptions
                  file={file}
                  selectedFormat={format}
                  onFormatChange={setFormat}
                  disabled={loading}
                />

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Converting..." : "Convert File"}
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && <LoadingSpinner message="Converting your file..." />}

            {/* Result */}
            {result && (
              <ResultPreview
                success={result.success}
                error={result.error}
                fileName={result.fileName}
                onDownload={handleDownload}
                onReset={handleReset}
              />
            )}

            {/* Supported Formats Info */}
            {!file && !result && (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4">
                  Supported Conversions:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>PDF:</strong> DOCX, XLSX, PNG, JPG, HTML, PPT
                  </div>
                  <div>
                    <strong>HTML:</strong> PDF
                  </div>
                  <div>
                    <strong>DOCX:</strong> PDF
                  </div>
                  <div>
                    <strong>XLSX:</strong> PDF
                  </div>
                  <div>
                    <strong>PPT/PPTX:</strong> PDF
                  </div>
                  <div>
                    <strong>Images:</strong> PNG, JPG, WebP conversions
                  </div>
                  <div>
                    <strong>Max Size:</strong> 1GB per file
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PDF Tools Tab */}
        {activeTab === "pdf" && <PdfToolsPanel />}

        {/* Image Tools Tab */}
        {activeTab === "image" && <ImageToolsPanel />}

        {activeTab === "scan" && <ScanToPdfPanel />}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 text-center py-6 mt-16 border-t border-slate-700">
        <p>
          Document Converter © 2026 • Secure • Fast • No registration required
        </p>
      </footer>
    </div>
  );
}
