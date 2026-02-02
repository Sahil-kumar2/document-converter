# Frontend Integration Guide

## Overview

This is a **complete, production-ready frontend** for the document converter backend. It includes:

- ✅ Quick file conversion (PDF, DOCX, XLSX, Images)
- ✅ Advanced PDF tools (split, extract, rotate, watermark, etc.)
- ✅ Image processing (black & white, OCR text extraction)
- ✅ Excel file merging
- ✅ Drag-and-drop file upload
- ✅ Real-time progress indicators
- ✅ Error handling and user feedback
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Modern UI inspired by iLovePDF

## Architecture

### Components Structure

```
src/
├── api.js                          # API service (all backend calls)
├── App.jsx                         # Main application component
├── components/
│   ├── FileUpload.jsx             # Reusable file upload with drag-drop
│   ├── ConversionOptions.jsx      # Format selection component
│   ├── LoadingSpinner.jsx         # Loading state indicator
│   ├── ResultPreview.jsx          # Success/error display + download
│   ├── PdfToolsPanel.jsx          # Advanced PDF operations
│   └── ImageToolsPanel.jsx        # Image processing tools
```

### Key Features

#### 1. **API Service Layer** (`api.js`)

Comprehensive API wrapper with all backend endpoints:

```javascript
// File Conversion
convertFile(file, targetFormat)

// PDF Operations
splitPdf(pdfFile, splitType, pageRanges)
extractPdf(pdfFile, pageNumbers)
rotatePdf(pdfFile, rotationAngle, pageNumbers)
cropPdf(pdfFile, x, y, width, height, pageNumbers)
watermarkPdf(pdfFile, text, position, opacity, fontSize, pageNumbers)
redactPdf(pdfFile, redactText, redactAreas, pageNumbers)
convertToPdfa(pdfFile, pdfaLevel)

// Image Operations
convertToBlackWhite(imageFile)
extractTextFromImage(imageFile)

// Excel Operations
mergeExcelFiles(excelFiles)

// AI Image Generation
generateImageFromPrompt(prompt)

// Error Handling
getErrorMessage(error)
```

#### 2. **Reusable Components**

**FileUpload.jsx**
- Drag-and-drop support
- File type validation
- Visual feedback on hover
- Disabled state support

**ConversionOptions.jsx**
- Format selection based on file type
- File info display (name, size)
- Automatic validation

**LoadingSpinner.jsx**
- Animated spinner
- Custom loading messages
- Progress feedback

**ResultPreview.jsx**
- Success/error messaging
- Download button for results
- Reset/try again functionality

**PdfToolsPanel.jsx**
- Tab-based tool selection
- Split, Extract, Rotate, Crop, Watermark, Redact, PDF/A conversion
- Tool-specific configuration panels

**ImageToolsPanel.jsx**
- Black & white conversion
- OCR text extraction
- Image format conversion
- Result preview

## Setup Instructions

### 1. **Environment Configuration**

Create `.env` file in `/client` directory:

```env
VITE_API_URL=http://localhost:9000
```

The frontend will automatically connect to the backend at `http://localhost:9000`.

### 2. **Install Dependencies**

```bash
cd client
npm install
```

### 3. **Start Development Server**

```bash
npm run dev
```

Server runs at `http://localhost:5173`

### 4. **Build for Production**

```bash
npm run build
```

## API Integration Details

### Backend Base URL

```
http://localhost:9000
```

### Endpoint Mapping

| Feature | Endpoint | Method | Payload |
|---------|----------|--------|---------|
| Convert File | `/api/convert` | POST | FormData: file, targetFormat |
| Split PDF | `/api/pdf/split` | POST | FormData: pdfFile, splitType, pageRanges* |
| Extract Pages | `/api/pdf/extract` | POST | FormData: pdfFile, pageNumbers |
| Rotate PDF | `/api/pdf/rotate` | POST | FormData: pdfFile, rotationAngle, pageNumbers* |
| Crop PDF | `/api/pdf/crop` | POST | FormData: pdfFile, cropX, cropY, cropWidth, cropHeight, pageNumbers* |
| Add Watermark | `/api/pdf/watermark` | POST | FormData: pdfFile, watermarkText, position, opacity, fontSize, pageNumbers* |
| Redact Content | `/api/pdf/redact` | POST | FormData: pdfFile, redactText*, redactAreas*, pageNumbers* |
| PDF/A Archival | `/api/pdf/pdfa` | POST | FormData: pdfFile, pdfaLevel |
| B&W Image | `/api/black-and-white-image/black-white` | POST | FormData: image |
| OCR Text | `/api/imageToText/getText` | POST | FormData: image |
| Merge Excel | `/api/excel/merge-excel` | POST | FormData: files[] (2+) |
| Generate Image | `/api/imageGeneration/generate-image` | POST | JSON: { prompt } |

\* = Optional

### Request/Response Examples

#### File Conversion

```javascript
// Request
const formData = new FormData();
formData.append("file", pdfFile);
formData.append("targetFormat", "docx");

const response = await apiClient.post("/api/convert", formData);

// Response: Binary blob (downloaded file)
```

#### PDF Split

```javascript
// Request
const formData = new FormData();
formData.append("pdfFile", pdfFile);
formData.append("splitType", "range");  // or "each"
formData.append("pageRanges", "1-3,5-7");

const response = await apiClient.post("/api/pdf/split", formData);

// Response: ZIP file with split PDFs or single PDF
```

#### Image to Text (OCR)

```javascript
// Request
const formData = new FormData();
formData.append("image", imageFile);

const response = await apiClient.post("/api/imageToText/getText", formData);

// Response
{
  "success": true,
  "message": "Text extracted and saved",
  "textFile": "/path/to/extracted/text.txt"
}
```

#### Excel Merge

```javascript
// Request
const formData = new FormData();
excelFiles.forEach(file => formData.append("files", file));

const response = await apiClient.post("/api/excel/merge-excel", formData);

// Response
{
  "success": true,
  "message": "Excel files merged successfully",
  "file": "/path/to/merged.xlsx"
}
```

## Error Handling

The frontend includes robust error handling:

```javascript
try {
  const response = await convertFile(file, format);
  // Handle success
} catch (error) {
  const userMessage = getErrorMessage(error);
  // Display error: "Invalid file type", "File too large", etc.
}
```

Error messages are extracted from:
1. `error.response.data.error`
2. `error.response.data.message`
3. `error.message`

## Conversion Rules

### Supported Conversions

**PDF → DOCX, XLSX, PNG, JPG**
**DOCX → PDF**
**XLSX → PDF**
**PPT/PPTX → PDF**
**Images (JPG/PNG/JPEG/WebP) → PNG/JPG**

### File Size Limit

- **Max per file**: 1GB
- **Timeout**: 2 minutes (for large files)

## UI/UX Features

### 1. **Responsive Design**
- Mobile: Single column, optimized touch targets
- Tablet: Two-column layout
- Desktop: Full feature layout

### 2. **Accessibility**
- Keyboard navigation support
- ARIA labels for screen readers
- Semantic HTML structure

### 3. **User Feedback**
- Loading spinners during processing
- Success notifications with download buttons
- Error messages with clear descriptions
- File preview (name, size)

### 4. **Visual Design**
- Modern gradient backgrounds
- Consistent color scheme (blue/purple primary)
- Smooth transitions and animations
- Dark mode compatible

## Component Usage Examples

### Quick File Conversion

```jsx
import FileUpload from "./components/FileUpload";
import ConversionOptions from "./components/ConversionOptions";

function MyComponent() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("");

  return (
    <>
      <FileUpload onFileSelect={setFile} />
      <ConversionOptions 
        file={file}
        selectedFormat={format}
        onFormatChange={setFormat}
      />
    </>
  );
}
```

### Advanced PDF Operations

```jsx
import PdfToolsPanel from "./components/PdfToolsPanel";

export default function PdfPage() {
  return <PdfToolsPanel />;
}
```

### Image Processing

```jsx
import ImageToolsPanel from "./components/ImageToolsPanel";

export default function ImagePage() {
  return <ImageToolsPanel />;
}
```

## Development Notes

### Technologies Used

- **React 19** - UI framework
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Optimization

- Code splitting via Vite
- Lazy component loading
- Optimized re-renders
- File blob streaming for downloads

### Security

- CORS configured for backend
- No credentials stored in frontend
- File validation on client
- Secure blob URL generation

## Troubleshooting

### "Cannot find package dotenv"

```bash
cd server
npm install
```

### API connection errors

1. Check backend is running: `http://localhost:9000`
2. Verify `.env` file: `VITE_API_URL=http://localhost:9000`
3. Check browser console for CORS errors

### File upload fails

1. Verify file type is supported
2. Check file size < 1GB
3. Check network connectivity
4. Review backend logs for details

### Conversion slow

- Large files take time (normal)
- Check server resource usage
- Monitor network speed

## Future Enhancements

- [ ] Batch file processing
- [ ] File preview/thumbnail generation
- [ ] Advanced compression options
- [ ] Cloud storage integration
- [ ] Conversion history
- [ ] User authentication
- [ ] Progress percentage tracking
- [ ] Concurrent file uploads

## License

Same as main project

## Support

For issues or questions, check:
1. Backend logs in `/server`
2. Browser console (F12)
3. Network tab in DevTools
4. Backend `POSTMAN.md` for API documentation
