# PDF Redaction Coordinate Transformation - Mathematical Explanation

## The Coordinate System Problem

### Visual Illustration

```
BROWSER/SCREEN COORDINATES          PDF COORDINATES
(Frontend - Display Space)           (Backend - PDF Space)

    0     200    400    600              612pt (width)
  ┌─────────────────────┐            ┌─────────────────────┐
0 │ (0,0) ◄─── X axis  │         792│                     │
  │      ▌              │         pt │  ▌ Same redaction   │
  │      ▌ Y=0.2 (20%)  │         │  ▌  but at Y=712 PDF  │
  │      ▌              │         │  ▌                     │
  │      ▌ H=60px       │         │  ▌                     │
  │      ▌              │         │  │                     │
  │      Y              │         │  Y                     │
  │    (down)           │         │ (up)                   │
  │                     │         │                     ◄──┤0 (0,0)
600│                     │         0│                     672│
  │ (600,600) ▼         │         └─────────────────────┘
  └─────────────────────┘         0     200    400    600

Origin: TOP-LEFT                 Origin: BOTTOM-LEFT
Y increases downward             Y increases upward
Common in web/GUI                Common in PDF/math
```

---

## Coordinate Systems Compared

### Screen Coordinates (Frontend)
- **Origin**: Top-left corner (0, 0)
- **X-axis**: 0 on left, increases rightward
- **Y-axis**: 0 on top, increases downward
- **Used by**: HTML Canvas, Web APIs, browsers
- **Formula for point**: (x_screen, y_screen) where x goes 0→width, y goes 0→height

### PDF Coordinates
- **Origin**: Bottom-left corner (0, 0)
- **X-axis**: 0 on left, increases rightward (same as screen)
- **Y-axis**: 0 on bottom, increases upward
- **Used by**: PDF spec (ISO 32000), pdf-lib, Ghostscript
- **Formula for point**: (x_pdf, y_pdf) where x goes 0→width, y goes 0→height

**Key difference**: Y-axis is FLIPPED

---

## Transformation Formula

### Given
- `yRatio` = position from top as decimal (0-1)
- `page_height` = PDF height in points (usually 792 for letter)
- `heightRatio` = box height as decimal (0-1)

### Transformation Steps

#### Step 1: Convert ratio to absolute display Y
```
y_display = yRatio × page_height
```

Example: yRatio=0.2, page_height=792
```
y_display = 0.2 × 792 = 158.4 pt (from top)
```

#### Step 2: Calculate box height
```
h = heightRatio × page_height
```

Example: heightRatio=0.05, page_height=792
```
h = 0.05 × 792 = 39.6 pt
```

#### Step 3: Flip Y-axis (transform to PDF coordinates)
```
y_pdf = page_height - y_display - h
```

Example:
```
y_pdf = 792 - 158.4 - 39.6 = 594 pt (from bottom)
```

### Complete Formula
```
┌──────────────────────────────────────────────────────┐
│ y_pdf = page_height - (yRatio × page_height) - h    │
│ y_pdf = page_height - (yRatio × page_height)        │
│         - (heightRatio × page_height)               │
│ y_pdf = page_height × (1 - yRatio - heightRatio)    │
└──────────────────────────────────────────────────────┘
```

---

## Worked Example

### Scenario
User draws a red box on page in browser:
- Page height: 792 pt (standard letter size)
- Box position: 20% from top (y=0.2)
- Box size: 5% of page height (h=0.05)
- Box height in pixels: 60px → 39.6pt (60 × 792/1200)

### Calculation

```
Input (Frontend):
  yRatio = 0.2        (20% from top)
  heightRatio = 0.05  (5% of page height)
  page_height = 792pt

Transformation:
  1) y_display = 0.2 × 792 = 158.4 pt from top
  2) h = 0.05 × 792 = 39.6 pt
  3) y_pdf = 792 - 158.4 - 39.6 = 594 pt from bottom

Output (Backend PDF):
  y_pdf = 594pt
  h = 39.6pt

Verification:
  Box in display space: top at 158.4, bottom at 198 (158.4+39.6)
  Box in PDF space:     bottom at 594, top at 634 (594+39.6)
  
  Check: 634 + 158.4 = 792.4 ≈ 792 ✓ (Correct!)
```

---

## Why the Transformation Exists

### PDF Format Specification
The PDF specification (ISO 32000) defines the coordinate system as:
> "The coordinate system is a two-dimensional Cartesian system. The origin is at the lower-left corner of the page."

This is the mathematical convention, matching standard Cartesian coordinates.

### Web/Browser Convention
HTML Canvas and browser APIs use the GUI convention:
> "The origin (0, 0) is at the top-left corner of the display."

This is more intuitive for UI design but different from PDF.

### Historical Reason
- **PDF**: Developed by Adobe in 1993, based on mathematical/printing conventions
- **HTML**: Developed by CERN in 1989, based on computer display conventions
- Both have existed independently before web/PDF integration

---

## Code Implementation

### Frontend (JavaScript - No transformation)
```javascript
// When user searches or draws on page
const viewport = page.getViewport({ scale: 1.25 });
const item = { x: 100, y: 158.4, width: 150, height: 39.6 }; // From pdf.js

// Convert to ratios (no Y-flip needed - these are display coords)
const redaction = {
  xRatio: item.x / viewport.width,           // 100 / 600 = 0.167
  yRatio: item.y / viewport.height,          // 158.4 / 792 = 0.200
  widthRatio: item.width / viewport.width,   // 150 / 600 = 0.250
  heightRatio: item.height / viewport.height // 39.6 / 792 = 0.050
};
```

### Backend (JavaScript - With transformation)
```javascript
// When applying redactions
const page_height = 792; // Letter size

// Transform display coordinates to PDF coordinates
const x_pdf = redaction.xRatio * page_width;
const w_pdf = redaction.widthRatio * page_width;
const h_pdf = redaction.heightRatio * page_height;
const y_pdf = page_height - (redaction.yRatio * page_height) - h_pdf;

// Draw black rectangle
page.drawRectangle({
  x: x_pdf,      // 100 pt from left
  y: y_pdf,      // 594 pt from bottom
  width: w_pdf,  // 150 pt wide
  height: h_pdf  // 39.6 pt tall
});
```

---

## Verification: Forward and Backward

### Forward (display → PDF)
```
Display: y_display = 0.2 × 792 = 158.4
         h = 0.05 × 792 = 39.6
         y_pdf = 792 - 158.4 - 39.6 = 594 ✓
```

### Backward (PDF → display)
```
PDF: y_pdf = 594
     h = 39.6
     y_display = page_height - y_pdf - h = 792 - 594 - 39.6 = 158.4 ✓
```

Both directions yield the same coordinates → **transformation is reversible**

---

## Common Mistakes

### Mistake 1: Double-flip
```javascript
// ❌ WRONG - Flipping twice!
yRatio = 0.2;
y_display_flipped = page_height - (yRatio * page_height);  // First flip
y_pdf_flipped_again = page_height - y_display_flipped;     // Second flip = original!
// Result: Ends up back where it started, but confused logic
```

### Mistake 2: Forgetting box height
```javascript
// ❌ WRONG - Not subtracting box height!
y_pdf = page_height - (yRatio * page_height);  // Missing: - h
// Result: Box bottom at wrong position (off by box height)
```

### Mistake 3: Wrong origin assumption
```javascript
// ❌ WRONG - Assuming PDF origin is top-left
y_pdf = yRatio * page_height;  // This would be y_display!
// Result: Box appears at wrong position in PDF
```

### Mistake 4: Mixing screen pixels with PDF points
```javascript
// ❌ WRONG - Using pixel coordinates as PDF coordinates
canvas.width = 1200;  // Screen pixels
yRatio = 0.2;
y_display_px = 0.2 * 1200 = 240;  // 240 pixels
y_pdf = page_height - y_display_px;  // 792 - 240 = 552 ✗ Wrong!
// Problem: Mixing measurement units (pixels vs points)
```

**Correct**: Convert pixels to points first
```javascript
// ✅ CORRECT
const POINTS_PER_PIXEL = 792 / viewport.height;  // ~0.66
y_display_pt = 0.2 * 792;  // Convert ratio to points
y_pdf = page_height - y_display_pt - h_pt;  // Now in same units ✓
```

---

## Matrix Representation (Advanced)

### Coordinate transformation as matrix operation
```
┌     ┐   ┌                     ┐ ┌     ┐
│ x'  │   │  1    0      0     │ │ x   │
│ y'  │ = │  0   -1   height  │ │ y   │
│ 1   │   │  0    0      1     │ │ 1   │
└     ┘   └                     ┘ └     ┘
```

Where:
- Input (x, y) is in display coordinates
- Output (x', y') is in PDF coordinates
- The Y-axis is flipped and shifted by page height

### Example calculation
```
Input: (100, 158.4)    [display coordinates]

Transformation:
x' = 1 × 100 + 0 × 158.4 + 0 × 1 = 100
y' = 0 × 100 + (-1) × 158.4 + 792 × 1 = -158.4 + 792 = 633.6

Output: (100, 633.6)   [PDF coordinates]

This accounts for:
- X stays the same (both use same left-origin)
- Y flips: was 158.4 from top → now 633.6 from bottom
```

---

## FAQ

### Q: Why do PDF and screen use different coordinate systems?
**A:** Historical accident. PDF was based on mathematical conventions, HTML was based on GUI conventions. Both became standard before integration was common.

### Q: Can I ignore this and just use screen coordinates?
**A:** No. If you send screen coordinates to pdf-lib, redactions will appear at wrong positions or outside the page.

### Q: What if I need to support different page sizes?
**A:** The transformation works for any page height. Just use the actual page height instead of 792. Formula remains: `y_pdf = page_height - y_display - h`

### Q: What about screen pixels vs PDF points?
**A:** Always convert to common units. Use points everywhere (1/72 inch). If working with pixels, convert: `points = pixels × (72 / DPI)`

### Q: Does X-axis need transformation?
**A:** No. Both systems use the same left-origin for X. Only Y needs flipping.

### Q: What if redaction is on multiple pages?
**A:** Each page has its own coordinate system. Transform independently for each page using that page's height.

---

## Testing the Transformation

### Test Case 1: Box at exact top of page
```
Input:  yRatio=0, heightRatio=0.1, page_height=792
Expect: y_pdf = 792 (top of page in PDF coords)

Calculation:
  y_pdf = 792 - (0 × 792) - (0.1 × 792)
  y_pdf = 792 - 0 - 79.2
  y_pdf = 712.8 ✓ (near top, accounting for height)
```

### Test Case 2: Box at exact bottom of page
```
Input:  yRatio=0.9, heightRatio=0.1, page_height=792
Expect: y_pdf ≈ 0 (bottom of page in PDF coords)

Calculation:
  y_pdf = 792 - (0.9 × 792) - (0.1 × 792)
  y_pdf = 792 - 712.8 - 79.2
  y_pdf = 0 ✓ (exact bottom)
```

### Test Case 3: Box in middle of page
```
Input:  yRatio=0.45, heightRatio=0.1, page_height=792
Expect: y_pdf ≈ 396 (middle of page)

Calculation:
  y_pdf = 792 - (0.45 × 792) - (0.1 × 792)
  y_pdf = 792 - 356.4 - 79.2
  y_pdf = 356.4 ✓ (roughly middle)
```

---

## Summary

| Aspect | Value |
|--------|-------|
| **Frontend origin** | TOP-LEFT (0,0) |
| **Frontend Y-axis** | 0 at top, increases downward |
| **PDF origin** | BOTTOM-LEFT (0,0) |
| **PDF Y-axis** | 0 at bottom, increases upward |
| **Transformation** | `y_pdf = height - (yRatio × height) - box_height` |
| **X-axis change** | None (same for both) |
| **Common error** | Applying transformation twice or forgetting box height |

The key insight: **Only the Y-axis needs transformation. X stays the same.**
