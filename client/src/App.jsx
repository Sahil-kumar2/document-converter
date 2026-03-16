import { useState, useEffect } from "react";
import { convertFile, getErrorMessage, logVisit } from "./api";
import FileUpload from "./components/FileUpload";
import ConversionOptions from "./components/ConversionOptions";
import ResultPreview from "./components/ResultPreview";
import LoadingSpinner from "./components/LoadingSpinner";
import PdfToolsPanel from "./components/PdfToolsPanel";
import ImageToolsPanel from "./components/ImageToolsPanel";
import ScanToPdfPanel from "./components/ScanToPdfPanel";

export default function App() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultBlob, setResultBlob] = useState(null);
  const [activeTab, setActiveTab] = useState("convert");

  useEffect(() => {
    logVisit();
  }, []);

  const conversionRules = {
    pdf: ["docx", "xlsx", "png", "jpg", "html", "pptx", "ppt"],
    html: ["pdf"],
    docx: ["pdf"],
    xlsx: ["pdf"],
    ppt: ["pdf"],
    pptx: ["pdf"],
    jpg: ["png", "pdf"],
    jpeg: ["png", "pdf"],
    png: ["jpg", "pdf"],
    webp: ["jpg", "png"],
  };

  const getFileExtension = (filename) =>
    filename.split(".").pop().toLowerCase();

  const handleFileChange = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.isArray(selectedFiles)
      ? selectedFiles
      : [selectedFiles];

    const firstFile = fileArray[0];
    const ext = getFileExtension(firstFile.name);

    if (!conversionRules[ext]) {
      setResult({
        success: false,
        error: `Unsupported file type: .${ext}`,
      });
      setFiles([]);
      return;
    }

    setFiles(fileArray);
    setFormat(conversionRules[ext][0]);
    setResult(null);
    setResultBlob(null);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) return;

    setLoading(true);

    try {
      const response = await convertFile(files, format);
      setResultBlob(response.data);

      const ext = getFileExtension(files[0].name);

      const downloadName =
        files.length > 1
          ? "converted-files.zip"
          : ext === "pdf" && ["png", "jpg", "jpeg"].includes(format)
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
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFiles([]);
    setFormat("");
    setResult(null);
    setResultBlob(null);
  };

  const ext =
    files.length > 0
      ? getFileExtension(files[0].name)
      : null;

  const options = ext ? conversionRules[ext] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📄</span>
            <div>
              <h1 className="text-4xl font-extrabold">
                Document Converter
              </h1>
              <p className="text-blue-100 text-lg">
                Convert & manipulate files online with ease
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "convert", name: "🔄 Quick Convert" },
            { id: "pdf", name: "🔧 PDF Tools" },
            { id: "image", name: "🖼️ Image Tools" },
            { id: "scan", name: "📷 Scan to PDF" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
                }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* QUICK CONVERT */}
        {activeTab === "convert" && (
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">

            {!files.length && !result && (
              <FileUpload
                onFileSelect={handleFileChange}
                disabled={loading}
                multiple
              />
            )}

            {files.length > 0 && !result && (
              <>
                <div className="text-sm text-gray-600">
                  <strong>Selected Files:</strong>
                  {files.map((f, i) => (
                    <div key={i}>{f.name}</div>
                  ))}
                </div>

                <ConversionOptions
                  file={files[0]}
                  selectedFormat={format}
                  onFormatChange={setFormat}
                  disabled={loading}
                />

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold disabled:opacity-50"
                >
                  {loading ? "Converting..." : "Convert File(s)"}
                </button>
              </>
            )}

            {loading && (
              <LoadingSpinner message="Converting your file(s)..." />
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
        )}

        {activeTab === "pdf" && <PdfToolsPanel />}
        {activeTab === "image" && <ImageToolsPanel />}
        {activeTab === "scan" && <ScanToPdfPanel />}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 text-center py-6 mt-16 border-t border-slate-700">
        Document Converter © 2026 • Secure • Fast • No registration required
      </footer>

    </div>
  );
}
