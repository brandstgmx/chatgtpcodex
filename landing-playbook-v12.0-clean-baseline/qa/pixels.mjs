import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
const dir = process.env.QA_OUTPUT_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), 'results');
const mode = process.argv[2] === 'reduced' ? 'full' : 'normal';
const results = [];
for (const width of [360,390,430,768,1024,1366,1440,1920]) {
  const original = PNG.sync.read(fs.readFileSync(path.join(dir, `original-${width}-${mode}.png`)));
  const clean = PNG.sync.read(fs.readFileSync(path.join(dir, `clean-${width}-${mode}.png`)));
  if (original.width !== clean.width || original.height !== clean.height) {
    results.push({ width, pass: false, reason: 'Image dimensions differ' });
    continue;
  }
  const diff = new PNG({ width: original.width, height: original.height });
  const differingPixels = pixelmatch(original.data, clean.data, diff.data, original.width, original.height, { threshold: 0.1 });
  const percent = differingPixels / (original.width * original.height) * 100;
  fs.writeFileSync(path.join(dir, `diff-${mode}-${width}.png`), PNG.sync.write(diff));
  results.push({ width, imageHeight: original.height, differingPixels, percent, pass: percent <= 0.1 });
}
fs.writeFileSync(path.join(dir, `pixels-${mode}.json`), JSON.stringify(results, null, 2));
console.log(results);
if (results.some(result => !result.pass)) process.exitCode = 1;
