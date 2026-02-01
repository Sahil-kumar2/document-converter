# API Usage Examples

This document provides practical examples of how to use each API function in your React components.

## Table of Contents

1. [File Conversion](#file-conversion)
2. [PDF Operations](#pdf-operations)
3. [Image Operations](#image-operations)
4. [Excel Operations](#excel-operations)
5. [Error Handling](#error-handling)

---

## File Conversion

### Example 1: Convert PDF to DOCX

```jsx
import { convertFile, getErrorMessage } from '../api';
import { useState } from 'react';

export function PdfToDocxConverter() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await convertFile(file, 'docx');
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted.docx';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleConvert} disabled={!file || loading}>
        {loading ? 'Converting...' : 'Convert to DOCX'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Example 2: Convert Image PNG to JPG

```jsx
import { convertFile } from '../api';

async function convertImageFormat(imageFile) {
  try {
    const response = await convertFile(imageFile, 'jpg');
    return response.data; // Returns blob
  } catch (error) {
    console.error('Conversion failed:', error);
    throw error;
  }
}

// Usage
const blob = await convertImageFormat(pngFile);
```

---

## PDF Operations

### Example 1: Split PDF into Multiple Files

```jsx
import { splitPdf } from '../api';
import { useState } from 'react';

export function PdfSplitter() {
  const [file, setFile] = useState(null);
  const [splitType, setSplitType] = useState('each');
  const [pageRanges, setPageRanges] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSplit = async () => {
    setLoading(true);
    try {
      const response = await splitPdf(
        file,
        splitType,
        splitType === 'range' ? pageRanges : null
      );

      // Download result
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'split-pdf.zip'; // or .pdf
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Split failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <select value={splitType} onChange={(e) => setSplitType(e.target.value)}>
        <option value="each">Split Each Page</option>
        <option value="range">Split by Range</option>
      </select>

      {splitType === 'range' && (
        <input
          type="text"
          placeholder="e.g., 1-3,5-7"
          value={pageRanges}
          onChange={(e) => setPageRanges(e.target.value)}
        />
      )}

      <button onClick={handleSplit} disabled={!file || loading}>
        {loading ? 'Processing...' : 'Split PDF'}
      </button>
    </div>
  );
}
```

### Example 2: Extract Specific Pages

```jsx
import { extractPdf } from '../api';

export function PageExtractor() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState('1,3,5-8');

  const handleExtract = async () => {
    try {
      const response = await extractPdf(file, pages);
      // Download the extracted PDF
      downloadBlob(response.data, 'extracted.pdf');
    } catch (error) {
      alert(error.response?.data?.error || 'Extraction failed');
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <input
        type="text"
        placeholder="Pages: 1,3,5-8"
        value={pages}
        onChange={(e) => setPages(e.target.value)}
      />
      <button onClick={handleExtract} disabled={!file}>
        Extract Pages
      </button>
    </div>
  );
}

// Helper function
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
```

### Example 3: Rotate PDF Pages

```jsx
import { rotatePdf } from '../api';

async function rotatePdfPages(pdfFile, angle = 90, pageNumbers = null) {
  try {
    const response = await rotatePdf(pdfFile, angle, pageNumbers);
    return response.data;
  } catch (error) {
    throw new Error(`Rotation failed: ${error.message}`);
  }
}

// Usage
const rotatedBlob = await rotatePdfPages(file, 180); // 180 degree rotation
```

### Example 4: Add Watermark to PDF

```jsx
import { watermarkPdf } from '../api';
import { useState } from 'react';

export function PdfWatermarker() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [position, setPosition] = useState('center');
  const [opacity, setOpacity] = useState(0.3);

  const handleWatermark = async () => {
    try {
      const response = await watermarkPdf(
        file,
        text,
        position,
        opacity,
        48 // font size
      );
      downloadBlob(response.data, 'watermarked.pdf');
    } catch (error) {
      alert('Watermarking failed: ' + error.message);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Watermark text"
      />

      <select value={position} onChange={(e) => setPosition(e.target.value)}>
        <option value="center">Center</option>
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
      </select>

      <div>
        <label>Opacity: {opacity.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
        />
      </div>

      <button onClick={handleWatermark} disabled={!file}>
        Add Watermark
      </button>
    </div>
  );
}
```

### Example 5: Convert PDF to PDF/A Archive

```jsx
import { convertToPdfa } from '../api';

export function PdfArchiver() {
  const handleArchiveConversion = async (pdfFile) => {
    try {
      const response = await convertToPdfa(pdfFile, 'PDF/A-2b');
      // Download archival PDF
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(response.data);
      link.download = 'archived.pdf';
      link.click();
    } catch (error) {
      console.error('Archive conversion failed:', error);
    }
  };

  return (
    <button onClick={() => handleArchiveConversion(file)}>
      Convert to PDF/A Archive
    </button>
  );
}
```

### Example 6: Redact Content from PDF

```jsx
import { redactPdf } from '../api';

async function redactPdfContent(
  pdfFile,
  textToRedact = 'SECRET',
  pageNumbers = null
) {
  try {
    const response = await redactPdf(pdfFile, textToRedact, null, pageNumbers);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Usage - Redact "SECRET" text from all pages
const redactedBlob = await redactPdfContent(file, 'SECRET');
```

---

## Image Operations

### Example 1: Convert Image to Black & White

```jsx
import { convertToBlackWhite } from '../api';
import { useState } from 'react';

export function ImageBWConverter() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    setLoading(true);
    try {
      const response = await convertToBlackWhite(file);

      if (response.data.success) {
        // The server returns the path to the processed image
        console.log('Processed image:', response.data.processedImage);
        alert('Image converted successfully!');
      }
    } catch (error) {
      alert('Conversion failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleConvert} disabled={!file || loading}>
        {loading ? 'Converting...' : 'Convert to B&W'}
      </button>
    </div>
  );
}
```

### Example 2: Extract Text from Image (OCR)

```jsx
import { extractTextFromImage } from '../api';
import { useState } from 'react';

export function ImageOcrExtractor() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExtract = async () => {
    setLoading(true);
    try {
      const response = await extractTextFromImage(file);

      if (response.data.success) {
        // Server returns path to text file
        console.log('Text file:', response.data.textFile);
        setExtractedText('Text extracted successfully');
        
        // Optional: Fetch the text content
        // const textContent = await fetch(response.data.textFile).then(r => r.text());
      }
    } catch (error) {
      console.error('Extraction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleExtract} disabled={!file || loading}>
        {loading ? 'Extracting...' : 'Extract Text'}
      </button>
      {extractedText && <p>{extractedText}</p>}
    </div>
  );
}
```

---

## Excel Operations

### Example 1: Merge Multiple Excel Files

```jsx
import { mergeExcelFiles } from '../api';
import { useState } from 'react';

export function ExcelMerger() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 Excel files');
      return;
    }

    setLoading(true);
    try {
      const response = await mergeExcelFiles(files);

      if (response.data.success) {
        // Download merged file
        const blob = new Blob([response.data.file]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'merged.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Merge failed: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx,.xls"
        multiple
        onChange={handleFileSelect}
      />
      <p>Selected: {files.length} files</p>
      <button onClick={handleMerge} disabled={files.length < 2 || loading}>
        {loading ? 'Merging...' : 'Merge Excel Files'}
      </button>
    </div>
  );
}
```

---

## Error Handling

### Example: Complete Error Handling Pattern

```jsx
import { convertFile, getErrorMessage } from '../api';
import { useState } from 'react';

export function RobustConverter() {
  const [state, setState] = useState({
    file: null,
    loading: false,
    error: null,
    success: false,
  });

  const handleConvert = async (targetFormat) => {
    if (!state.file) {
      setState(prev => ({ ...prev, error: 'Please select a file' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      success: false 
    }));

    try {
      const response = await convertFile(state.file, targetFormat);

      // Handle success
      setState(prev => ({ ...prev, success: true }));

      // Download file
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted.${targetFormat}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

    } catch (error) {
      // Get user-friendly error message
      const errorMessage = getErrorMessage(error);
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        success: false 
      }));

    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div>
      {state.error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffe0e0' }}>
          Error: {state.error}
        </div>
      )}

      {state.success && (
        <div style={{ color: 'green', padding: '10px', background: '#e0ffe0' }}>
          Conversion successful! File downloaded.
        </div>
      )}

      <input
        type="file"
        onChange={(e) => setState(prev => ({ 
          ...prev, 
          file: e.target.files[0],
          error: null 
        }))}
      />

      <button 
        onClick={() => handleConvert('pdf')}
        disabled={state.loading || !state.file}
      >
        {state.loading ? 'Converting...' : 'Convert to PDF'}
      </button>
    </div>
  );
}
```

---

## Helper Functions

### Download Blob Helper

```javascript
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, 100);
}
```

### File Size Formatter

```javascript
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

### File Validation

```javascript
export function validateFile(file, maxSize = 1024 * 1024 * 1024, allowedTypes = []) {
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}
```

---

## Notes

- All file uploads use FormData
- All file downloads use blob streaming
- All errors can be handled with `getErrorMessage()`
- Optional parameters can be `null`
- Backend timeout is 120 seconds (2 minutes)
- Max file size is 1GB

For more details, see the main API documentation in `api.js`.
