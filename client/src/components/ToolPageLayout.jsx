import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUpload from '../components/FileUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultPreview from '../components/ResultPreview'
import { validateFileSize, formatBytes } from '../utils/uploadLimits'

/**
 * ToolPageLayout - Safe wrapper for existing tool components
 * Uses conditional rendering to preserve layout stability
 */
export default function ToolPageLayout({
  title,
  icon,
  description,
  acceptedFiles,
  ToolComponent, // Existing component (CropPdfPanel, etc.)
  toolProps = {}, // Additional props for ToolComponent
  children, // For custom tool UI
}) {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [resultBlob, setResultBlob] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return

    const { valid, limit } = validateFileSize(selectedFile)
    if (!valid) {
      setUploadError(`File too large. Max allowed: ${formatBytes(limit)}.`)
      setFile(null)
      setResult(null)
      setResultBlob(null)
      return
    }

    setUploadError(null)
    setFile(selectedFile)
    setResult(null)
    setResultBlob(null)
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setResultBlob(null)
    setUploadError(null)
  }

  const handleDownload = () => {
    if (!resultBlob || !result?.fileName) return
    const url = window.URL.createObjectURL(resultBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.fileName
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition font-medium"
          >
            ← Back to Home
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          </div>
          <div className="w-32"></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Landing State - Upload */}
        {!file && !result && (
          <div className="text-center mb-12">
            <div className="text-8xl mb-6">{icon}</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              {description}
            </p>

            <div className="bg-white rounded-xl shadow-lg p-12 max-w-xl mx-auto border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Select your file</h3>
              <FileUpload
                onFileSelect={handleFileSelect}
                acceptedTypes={acceptedFiles}
                disabled={loading}
              />
              {uploadError && (
                <p className="text-sm text-red-600 mt-4">{uploadError}</p>
              )}
              <p className="text-sm text-gray-600 mt-4">
                Upload a file to get started
              </p>
            </div>
          </div>
        )}

        {/* Tool State - Show existing component WITHOUT modification */}
        {file && !result && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                <strong>File:</strong> {file.name}
              </p>
            </div>

            {/* CRITICAL: Existing component used as black box */}
            {ToolComponent && (
              <ToolComponent
                pdfFile={file}
                file={file}
                loading={loading}
                setLoading={setLoading}
                setResult={setResult}
                setResultBlob={setResultBlob}
                {...toolProps}
              />
            )}

            {/* Custom children for simple tools */}
            {children}
          </div>
        )}

        {loading && <LoadingSpinner message="Processing..." />}

        {/* Result State */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <ResultPreview
              success={result.success}
              error={result.error}
              fileName={result.fileName}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </div>
        )}
      </div>
    </div>
  )
}
