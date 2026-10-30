const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');

function getAllFiles(dir, exts = ['.jsx', '.js', '.css']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = getAllFiles(srcDir);
console.log('Total files to audit:', files.length);

const findings = [];

files.forEach(f => {
  const relPath = path.relative(srcDir, f);
  const content = fs.readFileSync(f, 'utf8');

  // Check for large fixed widths in style objects: e.g. width: '500px' or minWidth: '400px'
  const styleWidths = content.match(/(?:minWidth|width):\s*['"]([4-9]\d{2,}|\d{4,})px['"]/g);
  if (styleWidths) {
    findings.push({ file: relPath, type: 'Large Fixed Width', items: styleWidths.slice(0, 5) });
  }

  // Check for fixed gridTemplateColumns: repeat(4, 1fr) or similar inline styles
  const fixedGrids = content.match(/gridTemplateColumns:\s*['"]([^'"]+)['"]/g);
  if (fixedGrids) {
    const rigid = fixedGrids.filter(g => !g.includes('repeat(auto-') && !g.includes('1fr'));
    if (rigid.length > 0) {
      findings.push({ file: relPath, type: 'Fixed Grid', items: rigid.slice(0, 3) });
    }
  }
});

console.log(JSON.stringify(findings, null, 2));
