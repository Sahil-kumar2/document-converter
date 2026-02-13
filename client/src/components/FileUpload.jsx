import React, { useRef } from "react";


export default function FileUpload({
  onFileSelect,
  acceptedTypes = "*",
  multiple = false,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleFiles = (files) => {
    if (files.length > 0) {
      if (multiple) {
        onFileSelect(Array.from(files));
      } else {
        onFileSelect(files[0]);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
        isDragging
          ? "border-blue-500 bg-blue-50 bg-opacity-50"
          : "border-blue-200 bg-white"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl">📁</div>
        <h3 className="text-lg font-semibold text-gray-700">
          Drag and drop your file here
        </h3>
        <p className="text-gray-500">or</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          Browse Files
        </button>
        <p className="text-sm text-gray-400 mt-2">
          Max file size 1GB
        </p>
      </div>
    </div>
  );
}
