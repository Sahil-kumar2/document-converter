# Postman Testing Guide – PDF Tools API

Base URL: `http://localhost:3000`

---

## 1. Split PDF

**Method:** `POST`  
**URL:** `http://localhost:3000/api/pdf/split`

**Headers:**  
- None required (Content-Type is set automatically for form-data).

**Body:** `form-data`

| Key         | Type   | Value                    | Required |
|------------|--------|--------------------------|----------|
| pdfFile    | File   | (select a PDF file)      | Yes      |
| splitType  | Text   | `each` or `range`        | Yes      |
| pageRanges | Text   | e.g. `1-3,5-7` (for range)| For range|

**Example – Split each page (ZIP):**  
- pdfFile: [your.pdf]  
- splitType: `each`  

**Example – Split by range (single PDF):**  
- pdfFile: [your.pdf]  
- splitType: `range`  
- pageRanges: `1-3,5-7`

**Success:**  
- 200, binary: ZIP (split each) or PDF (split range).  
- Headers: `Content-Disposition: attachment; filename="..."`

**Error examples:**  
- 400: `{ "success": false, "error": "splitType must be \"each\" or \"range\"" }`  
- 400: `{ "success": false, "error": "PDF file is required (pdfFile)" }`  
- 400: `{ "success": false, "error": "pageRanges is required for splitType \"range\" and must be valid (e.g. 1-3,5-7)" }`

---

## 2. Crop PDF

**Method:** `POST`  
**URL:** `http://localhost:3000/api/pdf/crop`

**Body:** `form-data`

| Key         | Type   | Value                         | Required |
|------------|--------|-------------------------------|----------|
| pdfFile    | File   | (select a PDF file)           | Yes      |
| cropX      | Text   | number (e.g. `0`)             | Yes*     |
| cropY      | Text   | number (e.g. `0`)             | Yes*     |
| cropWidth  | Text   | number (e.g. `400`)           | Yes*     |
| cropHeight | Text   | number (e.g. `600`)           | Yes*     |
| pageNumbers| Text   | e.g. `1,3-5` (default: all)   | No       |

*Alternatively use form keys: `x`, `y`, `width`, `height` instead of cropX, cropY, cropWidth, cropHeight.

**Example:**  
- pdfFile: [your.pdf]  
- cropX: `50`  
- cropY: `50`  
- cropWidth: `400`  
- cropHeight: `600`  
- pageNumbers: `1,2` (optional; omit to crop all pages)

**Success:**  
- 200, binary PDF.  
- Headers: `Content-Disposition: attachment; filename="crop-....pdf"`

**Error examples:**  
- 400: `{ "success": false, "error": "cropBox required: x, y, width, height (numeric)..." }`  
- 400: `{ "success": false, "error": "PDF file is required (pdfFile)" }`

---

## 3. Extract Pages

**Method:** `POST`  
**URL:** `http://localhost:3000/api/pdf/extract`

**Body:** `form-data`

| Key         | Type   | Value              | Required |
|------------|--------|--------------------|----------|
| pdfFile    | File   | (select a PDF file)| Yes      |
| pageNumbers| Text   | e.g. `2,4,6-8`     | Yes      |

**Example:**  
- pdfFile: [your.pdf]  
- pageNumbers: `2,4,6-8`

**Success:**  
- 200, binary PDF containing only the specified pages.  
- Headers: `Content-Disposition: attachment; filename="extract-....pdf"`

**Error examples:**  
- 400: `{ "success": false, "error": "pageNumbers is required (e.g. \"2,4,6-8\")" }`  
- 400: `{ "success": false, "error": "Page 10 exceeds document page count (8)" }`

---

## 4. Rotate PDF

**Method:** `POST`  
**URL:** `http://localhost:3000/api/pdf/rotate`

**Body:** `form-data`

| Key            | Type  | Value                        | Required |
|----------------|-------|------------------------------|----------|
| pdfFile        | File  | (select a PDF file)          | Yes      |
| rotationAngle  | Text  | `90`, `180`, or `270`        | Yes      |
| pageNumbers    | Text  | e.g. `1,3,5-7` (default: all)| No       |

**Example – Rotate all pages 90° clockwise:**  
- pdfFile: [your.pdf]  
- rotationAngle: `90`  

**Example – Rotate pages 2–4 by 180°:**  
- pdfFile: [your.pdf]  
- rotationAngle: `180`  
- pageNumbers: `2-4`  

**Success:**  
- 200, binary PDF.  
- Headers: `Content-Disposition: attachment; filename="rotate-....pdf"`

**Error examples:**  
- 400: `{ "success": false, "error": "PDF file is required (pdfFile)" }`  
- 400: `{ "success": false, "error": "rotationAngle must be 90, 180, or 270" }`  
- 400: `{ "success": false, "error": "Page 10 exceeds document page count (8)" }`

---

## 5. Add Watermark

**Method:** `POST`  
**URL:** `http://localhost:3000/api/pdf/watermark`

**Body:** `form-data`

| Key           | Type  | Value                          | Required |
|---------------|-------|--------------------------------|----------|
| pdfFile       | File  | (select a PDF file)            | Yes      |
| watermarkText | Text  | watermark text (e.g. DRAFT)    | Yes      |
| position      | Text  | `center`, `top`, or `bottom`   | No (default: center) |
| opacity       | Text  | 0–1 (e.g. `0.3`)               | No (default: 0.3) |
| fontSize      | Text  | 8–200 (e.g. `48`)              | No (default: 48) |
| pageNumbers   | Text  | e.g. `1,3-5` (default: all)    | No       |

**Example:**  
- pdfFile: [your.pdf]  
- watermarkText: `CONFIDENTIAL`  
- position: `center`  
- opacity: `0.3`  
- fontSize: `48`  

**Success:**  
- 200, binary PDF.  
- Headers: `Content-Disposition: attachment; filename="watermark-....pdf"`

**Error examples:**  
- 400: `{ "success": false, "error": "PDF file is required (pdfFile)" }`  
- 400: `{ "success": false, "error": "watermarkText is required and must not be empty" }`  
- 400: `{ "success": false, "error": "opacity must be a number between 0 and 1" }`

---

## 6. Redact PDF

**Method:** `POST`  
**URL:** `http://localhost:3000/api/pdf/redact`

**Body:** `form-data`

| Key            | Type  | Value                                      | Required |
|----------------|-------|--------------------------------------------|----------|
| pdfFile        | File  | (select a PDF file)                        | Yes      |
| redactText     | Text  | Text to find and redact (e.g. Confidential)| No*      |
| redactAreas    | Text  | Areas: `pageNum:x,y,width,height` (semicolon-separated) | No* |
| pageNumbers    | Text  | e.g. `1,3,5-7` (default: all)              | No       |
| convertToPdfa  | Text  | `true` or `1` to convert to PDF/A after redaction | No  |
| pdfaLevel      | Text  | `PDF/A-1b`, `PDF/A-2b`, or `PDF/A-3b` (when convertToPdfa) | No |

*At least one of `redactText` or `redactAreas` must be provided. Redaction is **flattened** so text is permanently removed.

**redactAreas format:** `1:100,200,50,20;2:30,40,100,15` (page 1 at x=100,y=200 w=50 h=20; page 2 at x=30,y=40 w=100 h=15). PDF coordinates: origin bottom-left.

**Example – Redact by text:**  
- pdfFile: [your.pdf]  
- redactText: `Confidential`  

**Example – Redact by areas:**  
- pdfFile: [your.pdf]  
- redactAreas: `1:100,200,80,15;1:300,400,60,15`  

**Success:**  
- 200, binary PDF — redacted content is **flattened** (text permanently removed, not selectable/searchable).  
- Headers: `Content-Disposition: attachment; filename="redact-....pdf"`

**Error examples:**  
- 400: `{ "success": false, "error": "PDF file is required (pdfFile)" }`  
- 400: `{ "success": false, "error": "At least one of redactText or redactAreas must be provided" }`  
- 400: `{ "success": false, "error": "No valid redact areas (use pageNum:x,y,width,height)" }`

---

## 7. Convert PDF to PDF/A

**Method:** `POST`  
**URL:** `http://localhost:3000/api/pdf/pdfa`

**Body:** `form-data`

| Key       | Type  | Value                                    | Required |
|-----------|-------|------------------------------------------|----------|
| pdfFile   | File  | (select a PDF file)                      | Yes      |
| pdfaLevel | Text  | `PDF/A-1b` (default), `PDF/A-2b`, `PDF/A-3b` | No   |

**Example:**  
- pdfFile: [your.pdf]  
- pdfaLevel: `PDF/A-1b`  

**Success:**  
- 200, binary PDF/A file.  
- Headers: `Content-Disposition: attachment; filename="pdfa-....pdf"`

**Error examples:**  
- 400: `{ "success": false, "error": "PDF file is required (pdfFile)" }`  
- 400: `{ "success": false, "error": "pdfaLevel must be one of: PDF/A-1b, PDF/A-2b, PDF/A-3b" }`  
- 500: `{ "success": false, "error": "Ghostscript (gs) is not installed or not in PATH. Install Ghostscript to convert to PDF/A." }`  

**Note:** Ghostscript must be installed on the server for PDF/A conversion.

---

## Common Notes

- **File size limit:** 50 MB per PDF.  
- **Wrong file type:** Sending a non-PDF as `pdfFile` returns 400 (e.g. "Only PDF files are allowed").  
- **Health check:** `GET http://localhost:3000/health` → `{ "status": "ok", "service": "pdf-tools-api" }`.
