import { ImageResponse } from '@vercel/og';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fontData = readFileSync(join(__dirname, 'fonts', 'arialnarrow.ttf'));

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const text = (url.searchParams.get('text') || 'brat').toLowerCase();

  const SIZE = 500;
  const PADDING = 32;
  const BLUR_EXTRA = 20;
  const CANVAS_SIZE = SIZE + BLUR_EXTRA * 2;
  const MAX_WIDTH = SIZE - PADDING * 2;
  const MAX_HEIGHT = SIZE - PADDING * 2;
  const BLUR = 1.8;
  const LINE_HEIGHT = 0.92;

  // Estimasi lebar teks (mirip dengan getComputedStyle di browser)
  function estimateWidth(str, fs) {
    return str.length * fs * 0.48;
  }

  // Binary search untuk fontSize terbaik (sama kaya textFit)
  function findBestFontSize(words, minFs, maxFs) {
    let low = minFs;
    let high = maxFs;
    let bestSize = minFs;
    
    while (low <= high) {
      const mid = Math.floor((high + low) / 2);
      const lines = wrapText(words, mid);
      const maxLineWidth = Math.max(...lines.map(l => estimateWidth(l, mid)));
      const totalHeight = lines.length * mid * LINE_HEIGHT;
      
      if (maxLineWidth <= MAX_WIDTH && totalHeight <= MAX_HEIGHT) {
        bestSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return bestSize;
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

  const words = text.split(' ');
  
  // Gunakan binary search seperti textFit
  let fontSize = findBestFontSize(words, 16, 160);
  let lines = wrapText(words, fontSize);
  
  // Deteksi multiLine (sama seperti textFit)
  const singleLineHeight = fontSize; // perkiraan
  const multiLine = lines.length > 1 || (lines.length === 1 && estimateWidth(lines[0], fontSize) > MAX_WIDTH * 0.8);
  
  const anchor = multiLine ? 'flex-start' : 'center';

  const imageResponse = new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: anchor === 'center' ? 'center' : 'flex-start',
          padding: multiLine ? `${PADDING + BLUR_EXTRA}px` : `${BLUR_EXTRA}px`,
          filter: `blur(${BLUR}px)`,
        },
        children: [{
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: anchor === 'center' ? 'center' : 'flex-start',
              justifyContent: 'center',
              width: '100%',
            },
            children: lines.map((line, i) => ({
              type: 'div',
              props: {
                key: String(i),
                style: {
                  fontSize,
                  fontWeight: 900,
                  fontFamily: '"Arial Narrow"',
                  color: 'black',
                  lineHeight: LINE_HEIGHT,
                  whiteSpace: multiLine ? 'normal' : 'nowrap',
                  textAlign: anchor === 'center' ? 'center' : 'left',
                  width: '100%',
                },
                children: line,
              },
            })),
          },
        }],
      },
    },
    {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      fonts: [{
        name: 'Arial Narrow',
        data: fontData,
        weight: 900,
        style: 'normal',
      }],
    }
  );

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  
  const sharp = await import('sharp');
  const croppedBuffer = await sharp.default(buffer)
    .extract({ left: BLUR_EXTRA, top: BLUR_EXTRA, width: SIZE, height: SIZE })
    .png()
    .toBuffer();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(croppedBuffer);
}