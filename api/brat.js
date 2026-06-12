import { ImageResponse } from '@vercel/og';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Node.js runtime (bukan edge) — bisa baca filesystem
const __dirname = dirname(fileURLToPath(import.meta.url));
const fontData = readFileSync(join(__dirname, 'fonts', 'arialnarrow.ttf'));

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const text = (url.searchParams.get('text') || 'brat').toLowerCase();

  const SIZE = 500;
  const PADDING = 32;
  const BLUR_EXTRA = 20; // ruang ekstra untuk blur
  const CANVAS_SIZE = SIZE + BLUR_EXTRA * 2; // 540x540
  const MAX_WIDTH = SIZE - PADDING * 2;
  const MAX_HEIGHT = SIZE - PADDING * 2;
  const BLUR = 1.8;
  const LINE_HEIGHT = 0.92;

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

  const words = text.split(' ');
  let fontSize = 160;
  let lines = [];

  while (fontSize > 16) {
    lines = wrapText(words, fontSize);
    const totalH = lines.length * fontSize * LINE_HEIGHT;
    const maxW = Math.max(...lines.map(l => estimateWidth(l, fontSize)));
    if (totalH <= MAX_HEIGHT && maxW <= MAX_WIDTH) break;
    fontSize -= 4;
  }

  const multiLine = lines.length > 1;
  const lineHeight = fontSize * LINE_HEIGHT;
  const totalTextH = lines.length * lineHeight;
  const startY = SIZE / 2 - totalTextH / 2 + lineHeight * 0.85;
  const textX = multiLine ? PADDING : SIZE / 2;
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
              marginTop: multiLine ? '0' : 'auto',
              marginBottom: multiLine ? '0' : 'auto',
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
                  whiteSpace: 'pre',
                  textAlign: anchor === 'center' ? 'center' : 'left',
                  width: anchor === 'center' ? 'auto' : '100%',
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

  // Dapatkan buffer gambar 540x540 lalu crop ke 500x500
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