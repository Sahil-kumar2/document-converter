import { useState } from "react";
import { convertFile } from "./api";

export default function App() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  if (!file) return alert("Please select a file");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("targetFormat", format);

  setLoading(true);

  try {
    const res = await convertFile(formData);

    // Create blob with correct type
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);

    // Create hidden anchor
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `converted.${format}`;

    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (err) {
    console.error("Download error:", err);
    alert("Conversion failed");
  }

  setLoading(false);
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-200">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-5">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Document Converter
        </h1>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border rounded-lg p-2"
        />

        <select
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="w-full border rounded-lg p-2"
        >
          <option value="pdf">Convert to PDF</option>
          <option value="docx">Convert to Word</option>
          <option value="xlsx">Convert to Excel</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {loading ? "Converting..." : "Convert File"}
        </button>
      </div>
    </div>
  );
}
