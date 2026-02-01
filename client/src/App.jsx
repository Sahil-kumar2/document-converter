import { useState } from "react";
import { convertFile } from "./api";

export default function App() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(false);

  const conversionRules = {
    pdf: ["docx", "xlsx", "png", "jpg"],
    docx: ["pdf"],
    xlsx: ["pdf"],
    ppt: ["pdf"],
    pptx: ["pdf"],
    jpg: ["png"],
    jpeg: ["png"],
    png: ["jpg"],
    webp: ["jpg", "png"]
  };

  const getFileExtension = (filename) =>
    filename.split(".").pop().toLowerCase();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ext = getFileExtension(selectedFile.name);

    if (!conversionRules[ext]) {
      alert("Unsupported file type");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setFormat(conversionRules[ext][0]); // auto select first valid option
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetFormat", format);

    setLoading(true);

    try {
      const res = await convertFile(formData);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `converted.${format}`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error("Download error:", err);
      alert(err.response?.data?.error || "Conversion failed");
    }

    setLoading(false);
  };

  const ext = file ? getFileExtension(file.name) : null;
  const options = ext ? conversionRules[ext] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">

      {/* Header Section */}
      <div className="text-center mt-14">
        <h1 className="text-5xl font-extrabold text-gray-800">
          File Converter
        </h1>
        <p className="text-gray-500 mt-3 text-lg">
          Easily convert files from one format to another, online.
        </p>
      </div>

      {/* Upload Area */}
      <div className="mt-16 w-full max-w-4xl border-2 border-dashed border-blue-200 bg-white rounded-xl p-12 text-center shadow-sm">

        {/* Hidden File Input */}
        <input
          type="file"
          id="fileInput"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Choose Files Button */}
        <label
          htmlFor="fileInput"
          className="inline-flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-semibold cursor-pointer hover:bg-blue-700 transition"
        >
          📂 Choose Files
        </label>

        {file && (
          <p className="mt-4 text-gray-600">
            Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}

        {/* Format Selector appears only after file */}
        {file && (
          <div className="mt-8">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="border p-3 rounded-lg text-lg w-64"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  Convert to {opt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Convert Button */}
        {file && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-8 bg-indigo-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert File"}
          </button>
        )}

        {/* Footer Info */}
        <p className="text-gray-400 text-sm mt-6">
          Max file size 1GB. By proceeding, you agree to our Terms of Use.
        </p>
      </div>
    </div>
  );

}
