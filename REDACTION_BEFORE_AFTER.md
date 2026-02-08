# PDF Redaction - Before & After Code Examples

## Issue 1: Text Coordinate Calculation

### ❌ BEFORE (BROKEN)
```javascript
// Frontend: RedactPdfPanel.jsx line ~235
mapped.forEach((item) => {
  if (item.end <= idx || item.start >= end) return;
  const topY = viewport.height - item.y - item.height;  // ❌ WRONG!
  minX = Math.min(minX, item.x);
  minY = Math.min(minY, topY);  // Using flipped Y
  maxX = Math.max(maxX, item.x + item.width);
  maxY = Math.max(maxY, topY + item.height);
});

if (minX !== Infinity) {
  matches.push({
    id: `text-${pageIndex}-${idx}-${matches.length}`,
    pageIndex,
    xRatio: minX / viewport.width,
    yRatio: minY / viewport.height,  // ❌ Already flipped, using wrong value
    widthRatio: (maxX - minX) / viewport.width,
    heightRatio: (maxY - minY) / viewport.height,
    source: "text",
    enabled: true,
    text: textQuery.trim(),
  });
}
```

### ✅ AFTER (FIXED)
```javascript
// Frontend: RedactPdfPanel.jsx line ~245
mapped.forEach((item) => {
  if (item.end <= idx || item.start >= end) return;
  minX = Math.min(minX, item.x);
  minY = Math.min(minY, item.y);  // ✅ Use pdf.js coordinates directly
  maxX = Math.max(maxX, item.x + item.width);
  maxY = Math.max(maxY, item.y + item.height);
});

if (minX !== Infinity && minY !== Infinity) {
  matches.push({
    id: `text-${pageIndex}-${idx}-${matches.length}`,
    pageIndex,
    xRatio: minX / viewport.width,
    yRatio: minY / viewport.height,  // ✅ Correct ratio calculation
    widthRatio: (maxX - minX) / viewport.width,
    heightRatio: (maxY - minY) / viewport.height,
    source: "text",
    enabled: true,
    text: textQuery.trim(),
  });
}
```

**Explanation:**
- pdf.js returns coordinates already in display space (origin: TOP-LEFT)
- We convert to ratios by dividing by viewport dimensions
- Backend handles the PDF coordinate transformation (origin: BOTTOM-LEFT)
- No Y-axis flip needed at frontend level

---

## Issue 2: Backend Coordinate Transformation

### ❌ BEFORE (BROKEN)
```javascript
// Backend: redactPdfService.js normalizeRedactions() line ~145
if (
  typeof raw.xRatio === 'number' &&
  typeof raw.yRatio === 'number' &&
  typeof raw.widthRatio === 'number' &&
  typeof raw.heightRatio === 'number'
) {
  x = raw.xRatio * width;
  const rectHeight = raw.heightRatio * height;  // ❌ Used intermediate var
  y = height - (raw.yRatio * height) - rectHeight;
  w = raw.widthRatio * width;
  h = rectHeight;  // ❌ Then referenced it here - confusing logic
}

// ... later ...
if (w <= 0 || h <= 0) return;  // ❌ No bounds validation before drawing
```

### ✅ AFTER (FIXED)
```javascript
// Backend: redactPdfService.js normalizeRedactions() line ~150
if (
  typeof raw.xRatio === 'number' &&
  typeof raw.yRatio === 'number' &&
  typeof raw.widthRatio === 'number' &&
  typeof raw.heightRatio === 'number'
) {
  // Convert from frontend coordinates (0-1 range, top-left origin) to PDF coordinates
  x = raw.xRatio * width;
  w = raw.widthRatio * width;
  h = raw.heightRatio * height;
  // PDF has origin at BOTTOM-LEFT, so flip Y: y_pdf = height - y_display - h
  y = height - (raw.yRatio * height) - h;  // ✅ Clear, direct calculation
}

// Validate coordinates are within page bounds
if (w <= 0 || h <= 0) return;  // ✅ Pre-validation
x = Math.max(0, Math.min(x, width));     // ✅ Clamp X
y = Math.max(0, Math.min(y, height));    // ✅ Clamp Y
w = Math.min(w, width - x);              // ✅ Clamp width
h = Math.min(h, height - y);             // ✅ Clamp height

if (w <= 0 || h <= 0) return;  // ✅ Post-validation
```

**Explanation:**
- Clear separation of concerns: convert → validate → push
- Explicit coordinate transformation with comment
- Bounds checking prevents out-of-bounds drawing
- Prevents silent failures when coordinates are invalid

---

## Issue 3: Missing Flattening for All Redactions

### ❌ BEFORE (BROKEN)
```javascript
// Backend: redactPdfService.js line ~93
const hasTextRedaction = normalizedAreas.some(a => a.source === 'text');

let finalPath = preFlattenPath;

if (hasTextRedaction) {
  // Only flatten if text redaction
  const flattenPath = path.join(...);
  try {
    await flattenPdf(preFlattenPath, flattenPath, { dpi: 300 });
    finalPath = flattenPath;
  } finally {
    try { fs.unlinkSync(preFlattenPath); } catch (_) {}
  }
} else {
  // ❌ Area-only redactions NOT flattened!
  // PDF structure unchanged, boxes can be deleted
  finalPath = preFlattenPath;
}
```

**Problems:**
- Area redactions remain as PDF objects (can be deleted)
- Vector structure intact (can be edited)
- Users think content is hidden, but it's actually deletable

### ✅ AFTER (FIXED)
```javascript
// Backend: redactPdfService.js line ~102
const hasTextRedaction = normalizedAreas.some(a => a.source === 'text');
const hasAreaRedaction = normalizedAreas.some(a => a.source === 'area' || !a.source);

let finalPath = preFlattenPath;

// Always flatten to ensure redactions are permanent and text is unrecoverable
// This rasterizes the entire page, making text coordinates unrecoverable
console.log(`[Redact] Redaction types - text: ${hasTextRedaction}, area: ${hasAreaRedaction}`);
if (drawnCount > 0) {
  // ✅ Flatten ALL redactions
  const flattenPath = path.join(...);
  try {
    console.log(`[Redact] Flattening PDF to ensure permanent redaction...`);
    await flattenPdf(preFlattenPath, flattenPath, { dpi: 300 });
    console.log(`[Redact] Flattening complete. Output: ${flattenPath}`);
    finalPath = flattenPath;
  } catch (flattenErr) {
    console.error(`[Redact] Flattening failed: ${flattenErr.message}`);
    throw flattenErr;
  } finally {
    try { fs.unlinkSync(preFlattenPath); } catch (_) {}
  }
} else {
  console.warn(`[Redact] No redactions were drawn! Output will be identical to input.`);
}
```

**Benefits:**
- All redactions get rasterized (permanent)
- Text becomes part of image (unrecoverable)
- Boxes can't be selected or deleted
- Better logging for debugging

---

## Issue 4: Missing Input Validation

### ❌ BEFORE (BROKEN)
```javascript
// Backend: redactPdfController.js line ~31
let redactAreas = null;
if (hasAreas) {
  try {
    redactAreas = JSON.parse(redactAreasStr);
    if (!Array.isArray(redactAreas)) {
      return res.status(400).json({
        success: false,
        error: 'redactAreas must be a JSON array',
      });
    }
    // ❌ No validation of array contents!
    // Invalid coordinates silently accepted
  } catch (parseErr) {
    return res.status(400).json({
      success: false,
      error: 'Invalid redactAreas JSON format',
    });
  }
}
```

**Problems:**
- Missing coordinates accepted without error
- Wrong coordinate types silently ignored
- Users don't know why redactions didn't apply

### ✅ AFTER (FIXED)
```javascript
// Backend: redactPdfController.js line ~31
let redactAreas = null;
if (hasAreas) {
  try {
    redactAreas = JSON.parse(redactAreasStr);
    if (!Array.isArray(redactAreas)) {
      return res.status(400).json({
        success: false,
        error: 'redactAreas must be a JSON array',
      });
    }
    // ✅ Validate each redaction area
    for (const area of redactAreas) {
      if (!area || typeof area !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Each redaction area must be an object',
        });
      }
      const hasRatio = typeof area.xRatio === 'number' && typeof area.yRatio === 'number' &&
                      typeof area.widthRatio === 'number' && typeof area.heightRatio === 'number';
      const hasAbsolute = typeof area.x === 'number' && typeof area.y === 'number' &&
                         typeof area.width === 'number' && typeof area.height === 'number';
      if (!hasRatio && !hasAbsolute) {
        return res.status(400).json({
          success: false,
          error: 'Each redaction area must have either ratio coordinates (xRatio, yRatio, etc) or absolute coordinates (x, y, width, height)',
        });
      }
      if (!Number.isInteger(area.pageIndex) && !Number.isInteger(area.page)) {
        return res.status(400).json({
          success: false,
          error: 'Each redaction area must have a pageIndex',
        });
      }
    }
  } catch (parseErr) {
    return res.status(400).json({
      success: false,
      error: 'Invalid redactAreas JSON format: ' + parseErr.message,
    });
  }
}
```

**Benefits:**
- Clear error messages guide users
- Invalid data rejected early
- Prevents wasted processing
- Better debugging information

---

## Issue 5: Redaction Drawing - Added Logging

### ❌ BEFORE (SILENT FAILURES)
```javascript
// Backend: redactPdfService.js line ~50
const black = rgb(0, 0, 0);

normalizedAreas.forEach(area => {
  const page = pages[area.pageIndex];
  if (!page) return;  // ❌ Silent return, no indication

  const { width, height } = page.getSize();
  const x = Math.max(0, Math.min(area.x, width));
  const y = Math.max(0, Math.min(area.y, height));
  const w = Math.min(area.width, width - x);
  const h = Math.min(area.height, height - y);

  page.drawRectangle({  // ❌ No indication if drawing succeeds
    x,
    y,
    width: w,
    height: h,
    color: black,
  });
});
```

### ✅ AFTER (DETAILED LOGGING)
```javascript
// Backend: redactPdfService.js line ~50
const black = rgb(0, 0, 0);

console.log(`[Redact] Total redaction areas: ${normalizedAreas.length}`);  // ✅ Show count
let drawnCount = 0;

normalizedAreas.forEach((area, idx) => {
  const page = pages[area.pageIndex];
  if (!page) {
    console.warn(`[Redact] Page ${area.pageIndex} not found`);  // ✅ Warn missing page
    return;
  }

  const { width, height } = page.getSize();
  const x = Math.max(0, Math.min(area.x, width));
  const y = Math.max(0, Math.min(area.y, height));
  const w = Math.min(area.width, width - x);
  const h = Math.min(area.height, height - y);

  if (w <= 0 || h <= 0) {
    console.warn(`[Redact] Area ${idx} has invalid dimensions: w=${w}, h=${h}`);  // ✅ Warn invalid dims
    return;
  }

  console.log(`[Redact] Drawing area ${idx} on page ${area.pageIndex}: x=${x}, y=${y}, w=${w}, h=${h}, source=${area.source}`);  // ✅ Log each draw
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: black,
  });
  drawnCount++;
});

console.log(`[Redact] Successfully drawn ${drawnCount}/${normalizedAreas.length} redaction areas`);  // ✅ Summary
```

**Benefits:**
- Clear visibility into what's happening
- Identifies which redactions fail and why
- Helps debug coordinate issues
- Shows if nothing was drawn (common error)

---

## Summary of Changes

| Issue | Root Cause | Fix | Impact |
|-------|-----------|-----|--------|
| Text Y-axis | Incorrect flip | Use pdf.js coords directly | Correct box placement |
| Coord transform | Inconsistent logic | Clear transformation formula | Coordinates map correctly |
| No flattening | Only text triggered it | Always flatten all redactions | Permanent, unrecoverable |
| No validation | Missing checks | Validate all inputs | Clear error feedback |
| Silent failures | No logging | Add detailed console logs | Easy debugging |

---

## Testing Checklist

- [ ] Text search finds correct words
- [ ] Red highlight boxes appear on exact text location
- [ ] Manual drawn boxes appear in correct location
- [ ] Black boxes appear in final PDF (not preview boxes)
- [ ] Downloaded PDF cannot be searched with Ctrl+F
- [ ] Downloaded PDF text cannot be copied
- [ ] Multiple pages with mixed redactions work
- [ ] Check server logs show redaction progress
- [ ] Very long/large PDFs still redact correctly
- [ ] Combine text + area redactions on same page
