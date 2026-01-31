/**
 * Get form-data body value, tolerating keys with trailing/leading spaces (e.g. Postman).
 * @param {object} body - req.body
 * @param {string} preferredKey - e.g. 'pageRanges'
 * @returns {string|undefined}
 */
function getBodyValue(body, preferredKey) {
  if (!body || typeof body !== 'object') return undefined;
  const v = body[preferredKey];
  if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  const key = Object.keys(body).find((k) => k.trim() === preferredKey);
  return key != null ? String(body[key]).trim() : undefined;
}

module.exports = { getBodyValue };
