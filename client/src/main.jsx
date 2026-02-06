import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import HomePage from './pages/HomePage'

// PDF Tools
import SignPdfPage from './pages/tools/SignPdfPage'
import ProtectPdfPage from './pages/tools/ProtectPdfPage'
import OrganizePdfPage from './pages/tools/OrganizePdfPage'
import CompressPdfPage from './pages/tools/CompressPdfPage'
import MergePdfPage from './pages/tools/MergePdfPage'
import SplitPdfPage from './pages/tools/SplitPdfPage'
import RemovePagesPage from './pages/tools/RemovePagesPage'
import ExtractPagesPage from './pages/tools/ExtractPagesPage'
import RotatePdfPage from './pages/tools/RotatePdfPage'
import CropPdfPage from './pages/tools/CropPdfPage'
import WatermarkPdfPage from './pages/tools/WatermarkPdfPage'
import RedactPdfPage from './pages/tools/RedactPdfPage'
import RepairPdfPage from './pages/tools/RepairPdfPage'
import PdfaToPdfPage from './pages/tools/PdfaToPdfPage'

// Image Tools
import BlackWhitePage from './pages/tools/BlackWhitePage'
import ImageToTextPage from './pages/tools/ImageToTextPage'
import ScanToPdfPage from './pages/tools/ScanToPdfPage'
import JpgToPngPage from './pages/tools/JpgToPngPage'
import PngToJpgPage from './pages/tools/PngToJpgPage'
import JpgToPdfPage from './pages/tools/JpgToPdfPage'
import WebpToJpgPage from './pages/tools/WebpToJpgPage'
import WebpToPngPage from './pages/tools/WebpToPngPage'

// Quick Converts
import PdfToDocxPage from './pages/tools/PdfToDocxPage'
import DocxToPdfPage from './pages/tools/DocxToPdfPage'
import PdfToXlsxPage from './pages/tools/PdfToXlsxPage'
import PdfToJpgPage from './pages/tools/PdfToJpgPage'
import PdfToPngPage from './pages/tools/PdfToPngPage'
import PdfToHtmlPage from './pages/tools/PdfToHtmlPage'
import HtmlToPdfPage from './pages/tools/HtmlToPdfPage'
import PdfToPptPage from './pages/tools/PdfToPptPage'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/legacy" element={<App />} />
        
        {/* PDF Tools */}
        <Route path="/sign-pdf" element={<SignPdfPage />} />
        <Route path="/protect-pdf" element={<ProtectPdfPage />} />
        <Route path="/organize-pdf" element={<OrganizePdfPage />} />
        <Route path="/compress-pdf" element={<CompressPdfPage />} />
        <Route path="/merge-pdf" element={<MergePdfPage />} />
        <Route path="/split-pdf" element={<SplitPdfPage />} />
        <Route path="/remove-pages" element={<RemovePagesPage />} />
        <Route path="/extract-pages" element={<ExtractPagesPage />} />
        <Route path="/rotate-pages" element={<RotatePdfPage />} />
        <Route path="/crop-pdf" element={<CropPdfPage />} />
        <Route path="/watermark-pdf" element={<WatermarkPdfPage />} />
        <Route path="/redact-pdf" element={<RedactPdfPage />} />
        <Route path="/repair-pdf" element={<RepairPdfPage />} />
        <Route path="/pdf-to-pdfa" element={<PdfaToPdfPage />} />
        
        {/* Image Tools */}
        <Route path="/black-white-image" element={<BlackWhitePage />} />
        <Route path="/image-to-text" element={<ImageToTextPage />} />
        <Route path="/scan-to-pdf" element={<ScanToPdfPage />} />
        <Route path="/jpg-to-png" element={<JpgToPngPage />} />
        <Route path="/png-to-jpg" element={<PngToJpgPage />} />
        <Route path="/jpg-to-pdf" element={<JpgToPdfPage />} />
        <Route path="/webp-to-jpg" element={<WebpToJpgPage />} />
        <Route path="/webp-to-png" element={<WebpToPngPage />} />
        
        {/* Quick Converts */}
        <Route path="/pdf-to-docx" element={<PdfToDocxPage />} />
        <Route path="/docx-to-pdf" element={<DocxToPdfPage />} />
        <Route path="/pdf-to-xlsx" element={<PdfToXlsxPage />} />
        <Route path="/pdf-to-jpg" element={<PdfToJpgPage />} />
        <Route path="/pdf-to-png" element={<PdfToPngPage />} />
        <Route path="/pdf-to-html" element={<PdfToHtmlPage />} />
        <Route path="/html-to-pdf" element={<HtmlToPdfPage />} />
        <Route path="/pdf-to-pptx" element={<PdfToPptPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
