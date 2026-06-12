import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const text = (req.query.text || 'brat').toLowerCase();
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const SIZE = 500;
  const PADDING = 32;
  const MAX_WIDTH = SIZE - PADDING * 2;
  const MAX_HEIGHT = SIZE - PADDING * 2;
  const BLUR = 1.8;

  // Load font
  const fontPath = join(__dirname, 'fonts', 'arialnarrow.ttf');
  const fontB64 = readFileSync(fontPath).toString('base64');

  function estimateWidth(str, fs) {
    return str.length * fs * 0.48;
  }

  function wrapText(words, fs) {
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (estimateWidth(test, fs) > MAX_WIDTH && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const words = escaped.split(' ');
  let fontSize = 160;
  let lines = [];

  while (fontSize > 16) {
    lines = wrapText(words, fontSize);
    const totalH = lines.length * fontSize * 0.92;
    const maxW = Math.max(...lines.map(l => estimateWidth(l, fontSize)));
    if (totalH <= MAX_HEIGHT && maxW <= MAX_WIDTH) break;
    fontSize -= 4;
  }

  const multiLine = lines.length > 1;
  const lineHeight = fontSize * 0.92;
  const totalTextH = lines.length * lineHeight;
  const startY = SIZE / 2 - totalTextH / 2 + lineHeight * 0.85;
  const textX = multiLine ? PADDING : SIZE / 2;
  const anchor = multiLine ? 'start' : 'middle';

  const textElements = lines.map((line, i) => `
    <text
      x="${textX}"
      y="${startY + i * lineHeight}"
      text-anchor="${anchor}"
      font-family="Arial Narrow"
      font-weight="900"
      font-size="${fontSize}"
      fill="black"
      filter="url(#blur)"
    >${line}</text>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <defs>
      <style>
        @font-face {
          font-family: 'Arial Narrow';
          font-weight: 900;
          src: url('data:font/truetype;base64,${fontB64}') format('truetype');
        }
      </style>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="${BLUR}"/>
      </filter>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="white"/>
    ${textElements}
  </svg>`;

  try {
    const { Resvg } = await import('@resvg/resvg-js');
    const resvg = new Resvg(svg, {
      font: {
        loadSystemFonts: false,
        fontBuffers: [readFileSync(fontPath)],
      },
    });
    const png = resvg.render().asPng();
    const base64 = Buffer.from(png).toString('base64');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.json({ status: 200, creator: 'RyodevAPI', result: `data:image/png;base64,${base64}` });
  } catch (err) {
    // Fallback SVG
    const base64 = Buffer.from(svg).toString('base64');
    res.setHeader('Content-Type', 'application/json');
    return res.json({ status: 200, creator: 'RyodevAPI', result: `data:image/svg+xml;base64,${base64}` });
  }
}
