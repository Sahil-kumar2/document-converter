/**
 * Resolve signature placement on a PDF page.
 * If x/y are provided, they take priority.
 * @param {{
 *  pageWidth: number,
 *  pageHeight: number,
 *  position?: string,
 *  x?: number,
 *  y?: number,
 *  boxWidth: number,
 *  boxHeight: number,
 *  margin?: number
 * }} params
 * @returns {{ x: number, y: number }}
 */
function resolveSignaturePlacement({
  pageWidth,
  pageHeight,
  position,
  x,
  y,
  boxWidth,
  boxHeight,
  margin = 20,
}) {
  const hasNumericX = Number.isFinite(x);
  const hasNumericY = Number.isFinite(y);

  if (hasNumericX && hasNumericY) {
    return { x, y };
  }

  const safePosition = (position || "bottom-right").toLowerCase();
  const maxX = Math.max(0, pageWidth - boxWidth - margin);
  const maxY = Math.max(0, pageHeight - boxHeight - margin);

  switch (safePosition) {
    case "top-left":
      return { x: margin, y: maxY };
    case "top-right":
      return { x: maxX, y: maxY };
    case "bottom-left":
      return { x: margin, y: margin };
    case "center":
      return {
        x: Math.max(0, (pageWidth - boxWidth) / 2),
        y: Math.max(0, (pageHeight - boxHeight) / 2),
      };
    case "bottom":
      return { x: Math.max(0, (pageWidth - boxWidth) / 2), y: margin };
    case "top":
      return { x: Math.max(0, (pageWidth - boxWidth) / 2), y: maxY };
    case "bottom-right":
    default:
      return { x: maxX, y: margin };
  }
}

export { resolveSignaturePlacement };
