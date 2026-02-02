# Postman Testing Guide - New PDF Tools

## Import This Collection

You can manually create requests in Postman using these templates:

---

## 1. Compress PDF

### Request Details
```
Method: POST
URL: http://localhost:9000/api/pdf/compress
Headers: Content-Type: multipart/form-data
```

### Body (form-data)
| Key | Type | Value |
|-----|------|-------|
| pdfFile | file | [Select a PDF file] |
| compressionLevel | text | medium |

### Compression Levels
- `low` - Minimal compression
- `medium` - Balanced (default)
- `high` - Maximum compression

### Expected Response
- Status: 200 OK
- Type: application/pdf (binary)
- Headers:
  - `Content-Disposition: attachment; filename="compressed-*.pdf"`
  - `X-Original-Size: [size in bytes]`
  - `X-Compressed-Size: [size in bytes]`

### Test Cases
1. ✅ Compress with low level
2. ✅ Compress with medium level
3. ✅ Compress with high level
4. ❌ No file provided (expect 400)
5. ❌ Invalid compression level (expect 400)
6. ❌ Non-PDF file (expect error)

---

## 2. Merge PDFs

### Request Details
```
Method: POST
URL: http://localhost:9000/api/pdf/merge
Headers: Content-Type: multipart/form-data
```

### Body (form-data)
| Key | Type | Value |
|-----|------|-------|
| pdfFiles | file | [Select PDF 1] |
| pdfFiles | file | [Select PDF 2] |
| pdfFiles | file | [Select PDF 3] |

**Note:** Use the same key `pdfFiles` for all files

### Expected Response
- Status: 200 OK
- Type: application/pdf (binary)
- Headers:
  - `Content-Disposition: attachment; filename="merged-*.pdf"`

### Test Cases
1. ✅ Merge 2 PDFs
2. ✅ Merge 3+ PDFs
3. ✅ Merge 10 PDFs (maximum)
4. ❌ Only 1 file (expect 400)
5. ❌ No files (expect 400)
6. ❌ More than 10 files (expect error)

---

## 3. Remove Pages

### Request Details
```
Method: POST
URL: http://localhost:9000/api/pdf/remove-pages
Headers: Content-Type: multipart/form-data
```

### Body (form-data)
| Key | Type | Value |
|-----|------|-------|
| pdfFile | file | [Select a PDF file] |
| pageRanges | text | 1,3,5-7 |

### Page Range Format
- Single pages: `1,3,5`
- Ranges: `1-5`
- Mixed: `1,3,5-7,10-15`

### Expected Response
- Status: 200 OK
- Type: application/pdf (binary)
- Headers:
  - `Content-Disposition: attachment; filename="removed-pages-*.pdf"`

### Test Cases
1. ✅ Remove single page: `1`
2. ✅ Remove multiple pages: `1,3,5`
3. ✅ Remove range: `1-5`
4. ✅ Remove mixed: `1,3,5-7`
5. ❌ No pageRanges (expect 400)
6. ❌ Invalid format: `abc` (expect 400)
7. ❌ Invalid range: `10-5` (expect 400)

---

## 4. Repair PDF

### Request Details
```
Method: POST
URL: http://localhost:9000/api/pdf/repair
Headers: Content-Type: multipart/form-data
```

### Body (form-data)
| Key | Type | Value |
|-----|------|-------|
| pdfFile | file | [Select a corrupted PDF] |

### Expected Response (Success)
- Status: 200 OK
- Type: application/pdf (binary)
- Headers:
  - `Content-Disposition: attachment; filename="repaired-*.pdf"`

### Expected Response (Too Corrupted)
- Status: 422 Unprocessable Entity
- Body:
```json
{
  "success": false,
  "error": "This PDF is too corrupted to repair. The file may be severely damaged."
}
```

### Test Cases
1. ✅ Repair valid but slightly corrupted PDF
2. ✅ Repair moderately corrupted PDF
3. ❌ Severely corrupted PDF (expect 422)
4. ❌ No file (expect 400)
5. ❌ Non-PDF file (expect error)

---

## Quick Postman Setup

### Create Collection

1. Open Postman
2. Click "New" → "Collection"
3. Name: "PDF Tools - New Features"
4. Add 4 requests as described above

### Environment Variables (Optional)

Create an environment with:
```
BASE_URL = http://localhost:9000
```

Then use in requests:
```
{{BASE_URL}}/api/pdf/compress
```

---

## Postman Scripts

### Pre-request Script (for all requests)
```javascript
// Log request details
console.log('Request URL:', pm.request.url);
console.log('Request Method:', pm.request.method);
```

### Test Script - Compress PDF
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is PDF", function () {
    pm.response.to.have.header("Content-Type", "application/pdf");
});

pm.test("Has compression headers", function () {
    pm.response.to.have.header("X-Original-Size");
    pm.response.to.have.header("X-Compressed-Size");
});

// Log compression stats
var originalSize = pm.response.headers.get("X-Original-Size");
var compressedSize = pm.response.headers.get("X-Compressed-Size");
var reduction = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
console.log("Original Size:", originalSize, "bytes");
console.log("Compressed Size:", compressedSize, "bytes");
console.log("Reduction:", reduction, "%");
```

### Test Script - Merge PDFs
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is PDF", function () {
    pm.response.to.have.header("Content-Type", "application/pdf");
});

pm.test("Has filename", function () {
    pm.response.to.have.header("Content-Disposition");
});
```

### Test Script - Remove Pages
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is PDF", function () {
    pm.response.to.have.header("Content-Type", "application/pdf");
});
```

### Test Script - Repair PDF
```javascript
pm.test("Status code is 200 or 422", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 422]);
});

if (pm.response.code === 200) {
    pm.test("Response is PDF", function () {
        pm.response.to.have.header("Content-Type", "application/pdf");
    });
} else {
    pm.test("Has error message", function () {
        var jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property("error");
    });
}
```

---

## Sample Test Data

### Create Test PDFs

#### Simple Valid PDF
1. Create a text document
2. Add some content
3. Save as PDF

#### Multi-page PDF
1. Create a 10-page document
2. Save as PDF
3. Use for remove/extract tests

#### Corrupted PDF (for repair test)
1. Take a valid PDF
2. Open in hex editor
3. Modify some bytes
4. Save (creates corrupted PDF)

#### Large PDF (for compression test)
1. Find or create a PDF > 5MB
2. Test compression effectiveness

---

## Response Time Expectations

| Operation | Expected Time |
|-----------|--------------|
| Compress | 2-5 seconds |
| Merge (2 files) | 1-3 seconds |
| Merge (10 files) | 5-10 seconds |
| Remove Pages | 1-2 seconds |
| Repair | 2-4 seconds |

*Times may vary based on file size and system performance*

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "error": "This PDF is too corrupted to repair..."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

---

## Debugging Tips

### Enable Verbose Logging

Check server console for:
```
🐍 Running PDF compression: ...
📤 Python stdout: ...
⚠️ Python stderr: ...
```

### Common Issues

**Empty response:**
- Check Python path in service files
- Verify PyPDF2 is installed

**Timeout:**
- Increase Postman timeout (Settings → General → Request timeout)
- Check file size < 50MB

**CORS errors:**
- Verify CORS origins in app.js
- Check browser console for details

---

## Advanced Testing

### Collection Runner

1. Click "Runner" in Postman
2. Select "PDF Tools - New Features"
3. Add test data
4. Run all tests sequentially

### Performance Testing

Use Postman monitoring to:
- Track response times
- Monitor error rates
- Test under load

---

## Success Criteria

✅ All 4 endpoints return 200 for valid input
✅ Error handling works for invalid input
✅ Files download correctly
✅ Compression shows size reduction
✅ Merge preserves page order
✅ Remove pages works with ranges
✅ Repair handles corrupted files gracefully

---

**Ready to test! 🚀**

Start with Compress PDF as it's the simplest, then move to others.
