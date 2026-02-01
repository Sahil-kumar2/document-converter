/**
 * Parse redactAreas string into list of { pageIndex (0-based), x, y, width, height }.
 * Format: "pageNum:x,y,width,height" separated by semicolon or newline.
 * Example: "1:100,200,50,20;2:30,40,100,15"
 * @param {string} redactAreas
 * @param {number} maxPage - max page count (1-based)
 * @returns {{ areas: Array<{ pageIndex: number, x: number, y: number, width: number, height: number }>, error?: string }}
 */
function parseRedactAreas(redactAreas, maxPage = Infinity) {
  if (!redactAreas || typeof redactAreas !== 'string') {
    return { areas: [] };
  }

  const parts = redactAreas.split(/[;\n]/).map((p) => p.trim()).filter(Boolean);
  const areas = [];

  for (const part of parts) {
    const colonIdx = part.indexOf(':');
    if (colonIdx === -1) {
      return { areas: [], error: `Invalid redact area (missing :): ${part}. Use pageNum:x,y,width,height` };
    }
    const pageStr = part.slice(0, colonIdx).trim();
    const coordsStr = part.slice(colonIdx + 1).trim();
    const pageNum = parseInt(pageStr, 10);
    if (Number.isNaN(pageNum) || pageNum < 1) {
      return { areas: [], error: `Invalid page number in area: ${part}` };
    }
    if (pageNum > maxPage) {
      return { areas: [], error: `Page ${pageNum} exceeds document page count (${maxPage})` };
    }

    const coords = coordsStr.split(',').map((c) => parseFloat(c.trim()));
    if (coords.length !== 4 || coords.some(Number.isNaN)) {
      return { areas: [], error: `Invalid coordinates in area (need x,y,width,height): ${part}` };
    }
    const [x, y, width, height] = coords;
    if (width <= 0 || height <= 0) {
      return { areas: [], error: `Width and height must be positive: ${part}` };
    }

    areas.push({
      pageIndex: pageNum - 1,
      x,
      y,
      width,
      height,
    });
  }

  return { areas };
}

export { parseRedactAreas };
