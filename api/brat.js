import { createCanvas, registerFont } from 'canvas';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Register Arial Narrow font
try {
  registerFont(join(__dirname, 'fonts', 'arialnarrow.ttf'), {
    family: 'Arial Narrow',
    weight: '900',
  });
} catch (_) {}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const text = (req.query.text || 'brat').toLowerCase();

  const SIZE = 500;
  const PADDING = 32;
  const MAX_WIDTH = SIZE - PADDING * 2;
  const BLUR = 2;

  // Buat canvas sementara buat ukur teks
  const measureCanvas = createCanvas(SIZE, SIZE);
  const mCtx = measureCanvas.getContext('2d');

  // Cari fontSize yang pas
  let fontSize = 160;
  let lines = [];

  function getLines(ctx, words, fs) {
    ctx.font = `900 ${fs}px "Arial Narrow", Arial, sans-serif`;
    const result = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > MAX_WIDTH && current) {
        result.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) result.push(current);
    return result;
  }

  const words = text.split(' ');
  while (fontSize > 16) {
    lines = getLines(mCtx, words, fontSize);
    const lineH = fontSize * 0.95;
    const totalH = lines.length * lineH;
    if (totalH <= SIZE - PADDING * 2) break;
    fontSize -= 4;
  }

  // Render ke canvas
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // Background putih
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Setup teks
  ctx.font = `900 ${fontSize}px "Arial Narrow", Arial, sans-serif`;
  ctx.fillStyle = 'black';

  const lineHeight = fontSize * 0.95;
  const totalH = lines.length * lineHeight;
  const startY = SIZE / 2 - totalH / 2 + fontSize * 0.8;
  const multiLine = lines.length > 1;

  // Blur effect
  ctx.filter = `blur(${BLUR}px)`;

  lines.forEach((line, i) => {
    if (multiLine) {
      ctx.textAlign = 'left';
      ctx.fillText(line, PADDING, startY + i * lineHeight);
    } else {
      ctx.textAlign = 'center';
      ctx.fillText(line, SIZE / 2, startY + i * lineHeight);
    }
  });

  // Convert ke PNG
  const png = canvas.toBuffer('image/png');
  const base64 = png.toString('base64');

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.json({ status: 200, creator: 'RyodevAPI', result: `data:image/png;base64,${base64}` });
}
