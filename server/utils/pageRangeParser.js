/**
 * Parse page range string to array of 0-based indices.
 * Supports: "2,4,6-8" => [1, 3, 5, 6, 7]
 * @param {string} pageRanges - e.g. "1-3,5,7-8"
 * @param {number} maxPage - max page count (1-based) for validation
 * @returns {{ indices: number[], error?: string }}
 */
function parsePageRanges(pageRanges, maxPage = Infinity) {
  if (!pageRanges || typeof pageRanges !== 'string') {
    return { indices: [] };
  }

  const parts = pageRanges.split(',').map((p) => p.trim()).filter(Boolean);
  const indices = new Set();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end < 1) {
        return { indices: [], error: `Invalid range: ${part}` };
      }
      if (start > end) {
        return { indices: [], error: `Invalid range (start > end): ${part}` };
      }
      for (let p = start; p <= end; p++) {
        if (p > maxPage) {
          return { indices: [], error: `Page ${p} exceeds document page count (${maxPage})` };
        }
        indices.add(p - 1); // 1-based to 0-based
      }
    } else {
      const p = parseInt(part, 10);
      if (Number.isNaN(p) || p < 1) {
        return { indices: [], error: `Invalid page number: ${part}` };
      }
      if (p > maxPage) {
        return { indices: [], error: `Page ${p} exceeds document page count (${maxPage})` };
      }
      indices.add(p - 1);
    }
  }

  return { indices: Array.from(indices).sort((a, b) => a - b) };
}

module.exports = { parsePageRanges };
