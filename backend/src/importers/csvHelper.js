const fs = require('fs');

/**
 * Universal CSV / TSV text parser with quote handling, BOM removal, and header normalization.
 */
function parseCsv(content, options = {}) {
  const delimiter = options.delimiter || ',';
  // Strip BOM if present
  let clean = content.replace(/^\uFEFF/, '');

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuote = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // skip escaped quote
        } else {
          insideQuote = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        // Skip CR in CRLF
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(f => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  // Push last field & row if anything remaining
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map(h => normalizeHeader(h));
  const result = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj = {};
    for (let h = 0; h < headers.length; h++) {
      const headerKey = headers[h];
      obj[headerKey] = row[h] !== undefined ? row[h] : '';
    }
    result.push(obj);
  }

  return result;
}

function normalizeHeader(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

module.exports = {
  parseCsv,
  normalizeHeader
};
