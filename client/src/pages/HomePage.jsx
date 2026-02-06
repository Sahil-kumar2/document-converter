import { Link } from 'react-router-dom'

export default function HomePage() {
  const pdfTools = [
    { name: 'Sign PDF', icon: '✍️', route: '/sign-pdf', desc: 'Add signature to PDF' },
    { name: 'Protect PDF', icon: '🔒', route: '/protect-pdf', desc: 'Password protect PDF' },
    { name: 'Organize PDF', icon: '📑', route: '/organize-pdf', desc: 'Reorder pages' },
    { name: 'Compress PDF', icon: '📦', route: '/compress-pdf', desc: 'Reduce file size' },
    { name: 'Merge PDFs', icon: '🔗', route: '/merge-pdf', desc: 'Combine multiple PDFs' },
    { name: 'Split PDF', icon: '✂️', route: '/split-pdf', desc: 'Separate pages' },
    { name: 'Remove Pages', icon: '🗑️', route: '/remove-pages', desc: 'Delete pages' },
    { name: 'Extract Pages', icon: '📄', route: '/extract-pages', desc: 'Extract specific pages' },
    { name: 'Rotate Pages', icon: '🔄', route: '/rotate-pages', desc: 'Rotate PDF pages' },
    { name: 'Crop PDF', icon: '🔪', route: '/crop-pdf', desc: 'Trim PDF pages' },
    { name: 'Add Watermark', icon: '💧', route: '/watermark-pdf', desc: 'Add watermark' },
    { name: 'Redact PDF', icon: '🖍️', route: '/redact-pdf', desc: 'Hide sensitive info' },
    { name: 'Repair PDF', icon: '🔧', route: '/repair-pdf', desc: 'Fix corrupted PDF' },
    { name: 'Convert to PDF/A', icon: '📋', route: '/pdf-to-pdfa', desc: 'Archival format' },
  ]

  const imageTools = [
    { name: 'Black & White', icon: '⚫', route: '/black-white-image', desc: 'Convert to B&W' },
    { name: 'Image to Text', icon: '📝', route: '/image-to-text', desc: 'OCR extraction' },
    { name: 'Scan to PDF', icon: '📷', route: '/scan-to-pdf', desc: 'Create PDF from scans' },
    { name: 'JPG to PNG', icon: '🖼️', route: '/jpg-to-png', desc: 'Convert image format' },
    { name: 'PNG to JPG', icon: '🖼️', route: '/png-to-jpg', desc: 'Convert image format' },
    { name: 'JPG to PDF', icon: '📸', route: '/jpg-to-pdf', desc: 'Image to PDF' },
    { name: 'WEBP to JPG', icon: '🌐', route: '/webp-to-jpg', desc: 'Convert WEBP' },
    { name: 'WEBP to PNG', icon: '🌐', route: '/webp-to-png', desc: 'Convert WEBP' },
  ]

  const quickConverts = [
    { name: 'PDF to DOCX', icon: '📝', route: '/pdf-to-docx', desc: 'PDF to Word' },
    { name: 'DOCX to PDF', icon: '📄', route: '/docx-to-pdf', desc: 'Word to PDF' },
    { name: 'PDF to XLSX', icon: '📊', route: '/pdf-to-xlsx', desc: 'PDF to Excel' },
    { name: 'PDF to JPG', icon: '🖼️', route: '/pdf-to-jpg', desc: 'PDF to Image' },
    { name: 'PDF to PNG', icon: '🖼️', route: '/pdf-to-png', desc: 'PDF to Image' },
    { name: 'PDF to HTML', icon: '🌐', route: '/pdf-to-html', desc: 'PDF to Web' },
    { name: 'PDF to PPTX', icon: '📊', route: '/pdf-to-pptx', desc: 'PDF to PowerPoint' },
    { name: 'HTML to PDF', icon: '📄', route: '/html-to-pdf', desc: 'Web to PDF' },
  ]

  const ToolCard = ({ name, icon, route, desc }) => (
    <Link
      to={route}
      className="group block bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 hover:border-red-400"
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="text-5xl">{icon}</div>
        <h3 className="text-lg font-bold text-gray-900">{name}</h3>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </Link>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">📄</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DocumentConverter</h1>
                <p className="text-sm text-gray-600">Every tool you need to work with PDFs & images</p>
              </div>
            </div>
            <a href="/legacy" className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded hover:bg-gray-100 transition">
              Legacy Mode
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          All PDF & Image Tools in One Place
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Free, fast, and easy to use. No registration required.
        </p>
      </section>

      {/* PDF Tools Section */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">📄</div>
          <h2 className="text-3xl font-bold text-gray-900">PDF Tools</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {pdfTools.map((tool) => (
            <ToolCard key={tool.route} {...tool} />
          ))}
        </div>
      </section>

      {/* Image Tools Section */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">🖼️</div>
          <h2 className="text-3xl font-bold text-gray-900">Image Tools</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {imageTools.map((tool) => (
            <ToolCard key={tool.route} {...tool} />
          ))}
        </div>
      </section>

      {/* Quick Converts Section */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">⚡</div>
          <h2 className="text-3xl font-bold text-gray-900">Quick Converts</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {quickConverts.map((tool) => (
            <ToolCard key={tool.route} {...tool} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>© 2024 DocumentConverter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
