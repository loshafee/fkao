import { Resvg } from '@resvg/resvg-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

function renderIcon(size) {
  const sizedSvg = svgContent
    .replace(/width="[^"]*"/, `width="${size}"`)
    .replace(/height="[^"]*"/, `height="${size}"`);
  const resvg = new Resvg(sizedSvg, {
    fitTo: { mode: 'width', value: size },
  });
  const pngData = resvg.render();
  const outPath = path.join(__dirname, '..', 'public', `icon-${size}.png`);
  fs.writeFileSync(outPath, pngData.asPng());
  console.log(`Generated ${outPath}`);
}

renderIcon(192);
renderIcon(512);
