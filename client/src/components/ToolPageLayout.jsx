import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUpload from '../components/FileUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import ResultPreview from '../components/ResultPreview'

export default function ToolPageLayout({
  title,
  icon,
  description,
  acceptedFiles,
  ToolComponent,
  toolProps = {},
  children,
}) {
  const navigate = useNavigate()

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [resultBlob, setResultBlob] = useState(null)

  const handleFileSelect = (selectedFiles) => {
    if (!selectedFiles) return

    const fileArray = Array.isArray(selectedFiles)
      ? selectedFiles
      : [selectedFiles]

    setFiles(fileArray)
    setResult(null)
    setResultBlob(null)
  }

  const handleReset = () => {
    setFiles([])
    setResult(null)
    setResultBlob(null)
  }

  const handleDownload = () => {
    if (!resultBlob || !result?.fileName) return

    // Use the blob directly — do NOT re-wrap it
    // (axios responseType:"blob" already returns a properly typed Blob)
    const a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a')
    a.download = result.fileName
    a.rel = 'noopener'
    a.href = URL.createObjectURL(resultBlob)

    // Revoke after 40 seconds (generous time for large files)
    setTimeout(() => URL.revokeObjectURL(a.href), 40000)
    // Click on next event loop tick (file-saver.js pattern)
    setTimeout(() => a.click(), 0)
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

        {/* Upload State */}
        {files.length === 0 && !result && (
          <div className="text-center mb-12">
            <div className="text-8xl mb-6">{icon}</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              {description}
            </p>

            <div className="bg-white rounded-xl shadow-lg p-12 max-w-xl mx-auto border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Select your file(s)
              </h3>

              <FileUpload
                onFileSelect={handleFileSelect}
                accept={acceptedFiles}
                disabled={loading}
                multiple
              />

              <p className="text-sm text-gray-600 mt-4">
                Upload one or more files to get started
              </p>
            </div>
          </div>
        )}

        {/* Tool State */}
        {files.length > 0 && !result && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                <strong>Selected Files:</strong>
              </p>
              {files.map((f, index) => (
                <p key={index} className="text-sm text-gray-700">
                  {f.name}
                </p>
              ))}
            </div>

            {ToolComponent && (
              <ToolComponent
                pdfFile={files[0]}
                files={files}
                loading={loading}
                setLoading={setLoading}
                setResult={setResult}
                setResultBlob={setResultBlob}
                {...toolProps}
              />
            )}

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
