# PDF Redaction - Quick Testing Guide

## Step-by-Step Testing

### Test 1: Simple Text Redaction ✓
**Goal:** Verify text search finds and redacts text correctly

1. Go to the Redact PDF tool
2. Upload a PDF with clear text (e.g., sample.pdf with "Hello World")
3. In the right panel, enter search term: `Hello`
4. Click "Find" button
5. **Expected:** Red boxes appear on all instances of "Hello" in preview

   ```
   ✅ CORRECT: Red highlight exactly on text
   ❌ WRONG: Red highlight misaligned or missing
   ```

6. Verify checkbox next to "Page 1" shows "1/1"
7. Ensure the match checkbox is checked ☑️
8. Click "Apply Redactions"
9. **Wait** for download (30-60 seconds for flattening)

10. **Test the downloaded PDF:**
    - Open with Ctrl+F and search for "Hello" → **Should NOT find it**
    - Try to copy text from redacted area → **Should fail or show boxes**
    - Open with Acrobat Reader → **Black boxes should be permanent**

---

### Test 2: Manual Box Redaction ✓
**Goal:** Verify drawn boxes are properly redacted

1. Go to Redact PDF tool
2. Upload a PDF
3. Scroll to a page with important info (like phone number, email)
4. **Click and drag** to draw a black box over the content
   
   ```
   ✅ CORRECT: Dark semi-transparent box appears while drawing
   ❌ WRONG: No box appears or box misplaced
   ```

5. You should see the area counter increment (e.g., "Area redactions: 1")
6. Click "Apply Redactions"
7. Download and verify:
   - Black box is permanent
   - Content underneath completely covered
   - Box position matches where you drew it

---

### Test 3: Combined Text + Area ✓
**Goal:** Verify both types of redactions work together

1. Upload a PDF with "SSN: 123-45-6789"
2. Search for "SSN" and mark match as enabled
3. **Draw a box** around the actual number "123-45-6789"
4. Check counters show:
   - Text redactions: 1
   - Area redactions: 1
5. Apply both
6. Download and verify **both areas are redacted**

---

### Test 4: Multi-Page Redactions ✓
**Goal:** Verify redactions work correctly across multiple pages

1. Upload a 5+ page PDF
2. Add redactions on:
   - Page 1: 1 text search
   - Page 3: 1 drawn box
   - Page 5: 2 text searches
3. Leave pages 2 and 4 untouched
4. Apply all redactions
5. Download and verify:
   - ✅ Page 1 has red box
   - ✅ Page 2 is completely unchanged
   - ✅ Page 3 has black box
   - ✅ Page 4 is completely unchanged
   - ✅ Page 5 has 2 black boxes

---

## Server Log Verification

After applying redactions, check server console for logs:

```
[Redact] Total redaction areas: 3
[Redact] Drawing area 0 on page 0: x=100, y=200, w=150, h=30, source=text
[Redact] Drawing area 1 on page 0: x=200, y=400, w=100, h=20, source=area
[Redact] Drawing area 2 on page 4: x=50, y=100, w=80, h=25, source=text
[Redact] Successfully drawn 3/3 redaction areas
[Redact] Redaction types - text: true, area: true
[Redact] Flattening PDF to ensure permanent redaction...
[Redact] Flattening complete. Output: /path/to/redacted-1707xxxxx.pdf
```

### What Each Log Means:
- **Total redaction areas**: How many boxes to draw
- **Drawing area X**: Coordinates being drawn (should be within page bounds)
- **Successfully drawn**: Count of successful vs attempted
- **Flattening complete**: PDF has been rasterized (permanent)

### Troubleshooting Logs:

| Log | Meaning | Fix |
|-----|---------|-----|
| `Area X has invalid dimensions: w=0, h=0` | Box too small or outside bounds | Redraw larger box |
| `Page X not found` | Trying to redact wrong page | Check page numbers |
| `No redactions were drawn` | Redactions not applied before flatten | Check if enabled ☑️ |
| `Flattening failed` | Ghostscript error | Check Ghostscript installed |

---

## Common Problems & Solutions

### Problem: Red boxes appear but download looks unchanged

**Cause:** Flattening failed silently OR redactions not being drawn

**Debug steps:**
1. Check server console for `Successfully drawn X/Y` message
   - If X < Y: Some redactions failed
   - If X = 0: No redactions applied
2. Check coordinates are reasonable (between 0 and page dimensions)
3. Ensure checkbox is ☑️ checked next to redactions

**Solution:**
- Redraw the box or search again
- Check that coordinates appear reasonable in logs
- Verify Ghostscript is installed: `gswin64c -version`

---

### Problem: Boxes appear but in wrong location

**Cause:** Coordinate transformation error

**Debug steps:**
1. Note which box is wrong
2. Check server log for that box's coordinates
   - Example: `x=100, y=200, w=150, h=30`
3. Compare to where box appears
   - Box should be at that (x, y) position with that (w, h) size

**Solution:**
- This would indicate a bug in coordinate transformation
- File an issue with:
  - PDF used (or sample)
  - Search term or box location
  - Server log output
  - Screenshot of result

---

### Problem: Text still searchable in PDF

**Cause:** PDF didn't flatten OR Ghostscript not working

**Debug steps:**
1. Check server console for `Flattening complete` message
2. If missing: Ghostscript failed
3. Check if Ghostscript installed: `gswin64c -version`

**Solution:**
- Install Ghostscript: https://www.ghostscript.com/download/gsdnld.html
- Or set `GS_PATH` environment variable to gs binary
- Check `resolveGhostscriptCommand()` in ghostscript.js

---

### Problem: Download times out (>2 minutes)

**Cause:** PDF too large for flattening

**Why this happens:**
- Flattening rasterizes at 300 DPI
- Large PDFs become very large images
- Ghostscript needs time to process

**Solution:**
- For large PDFs: Reduce flattening DPI to 150 in redactPdfService.js
- Or skip flatten for area-only redactions (faster but less secure)
- Or process in background (not implemented yet)

---

## Visual Verification Checklist

### During Preview (Frontend)
- [ ] Red boxes appear exactly on searched text
- [ ] Area drawn boxes appear in correct location
- [ ] Checkboxes next to "Page X" show correct count
- [ ] Enabled/disabled status toggles correctly
- [ ] Multiple pages scroll smoothly
- [ ] Counters update when redactions added/removed

### After Download (PDF)
- [ ] Black boxes visible at exact redaction locations
- [ ] Text under redactions completely invisible
- [ ] Ctrl+F search doesn't find redacted text
- [ ] Copy/paste from redacted area shows boxes, not text
- [ ] Box color is solid black (not gray or transparent)
- [ ] Boxes don't have soft edges (should be sharp)
- [ ] Redaction can't be deleted/moved in PDF editor
- [ ] File size significantly reduced (due to flattening)

---

## Advanced Testing

### Test: Extreme Coordinates
- Draw box at very edge of page
- Draw tiny box (few pixels)
- Draw very large box (full page)
- **All should redact correctly**

### Test: Different PDF Types
- Text-only PDF (like Word export)
- Scanned PDF (images with OCR)
- Mixed PDF (text + images)
- PDF with forms
- **All should work**

### Test: Large PDFs
- 50+ page document
- High-resolution document
- Document with many images
- **Performance should be acceptable (<2 minutes)**

---

## Performance Benchmarks

Expected times for common scenarios:

```
Small PDF (2-5 pages, <1MB):        15-30 seconds
Medium PDF (10-20 pages, 5MB):      45-90 seconds
Large PDF (50+ pages, 20MB):        2-3 minutes
Very Large PDF (100+ pages, 50MB):  5+ minutes
```

If taking longer:
1. Check server isn't doing other work
2. Verify disk space available
3. Check Ghostscript path is correct
4. Consider reducing flattening DPI from 300 to 150

---

## Success Criteria ✓

All tests should confirm:

- ✅ Text search correctly highlights matching text
- ✅ Manual boxes can be drawn anywhere on page
- ✅ Black redaction boxes appear in final PDF
- ✅ Redacted text cannot be searched (Ctrl+F)
- ✅ Redacted text cannot be copied
- ✅ Multiple pages handled correctly
- ✅ Combined text + area redactions work together
- ✅ Server logs show correct progress
- ✅ No unexpected error messages
- ✅ Final PDF opens in all PDF readers

---

## Report Template for Issues

If something doesn't work:

```
ISSUE: [Brief description]
STEPS:
1. Uploaded: [file name/size/type]
2. Searched for: [text or drew box at X,Y]
3. Applied: [X text, Y area redactions]

EXPECTED: [What should happen]
ACTUAL: [What actually happened]

LOGS: [Copy relevant server console output]
SCREENSHOT: [Attach screenshot showing issue]
```

Example:
```
ISSUE: Text redaction appears wrong location
STEPS:
1. Uploaded: invoice.pdf (2 pages)
2. Searched for: "Total"
3. Red box appeared on correct text
4. Applied redactions

EXPECTED: Black box on "Total" in final PDF
ACTUAL: Black box appears higher on page

LOGS:
[Redact] Drawing area 0 on page 0: x=100, y=200, w=150, h=30, source=text

SCREENSHOT: [attached]
```
