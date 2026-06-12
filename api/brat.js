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
  const MAX_WIDTH = SIZE - PADDING * 2;
  const MAX_HEIGHT = SIZE - PADDING * 2;
  const BLUR = 1.8;
  const LINE_HEIGHT = 0.9;

  function estimateWidth(str, fs) {
    return str.length * fs * 0.44;
  }

  function wrapText(words, fs) {
    if (words.length === 1) {
      const word = words[0];
      if (estimateWidth(word, fs) <= MAX_WIDTH) return [word];
      const lines = [];
      let current = '';
      for (const char of word) {
        const test = current + char;
        if (estimateWidth(test, fs) > MAX_WIDTH && current) {
          lines.push(current);
          current = char;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      return lines;
    }
    const lines = [];
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = current + ' ' + words[i];
      if (estimateWidth(test, fs) > MAX_WIDTH) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    lines.push(current);
    return lines;
  }

  const words = escaped.split(' ');
  let fontSize = 160;
  let lines = [];

  while (fontSize >= 16) {
    lines = wrapText(words, fontSize);
    const totalH = lines.length * fontSize * LINE_HEIGHT;
    if (totalH <= MAX_HEIGHT) break;
    fontSize -= 4;
  }

  const imageResponse = new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: SIZE,
          height: SIZE,
          background: 'white',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: `${PADDING}px`,
          filter: `blur(${BLUR}px)`,
        },
        children: [{
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            },
            children: lines.map((line, i) => ({
              type: 'div',
              props: {
                key: String(i),
                style: {
                  fontSize,
                  fontWeight: 200,
                  fontFamily: '"Arial Narrow"',
                  color: 'black',
                  lineHeight: LINE_HEIGHT,
                  whiteSpace: 'pre',
                },
                children: line,
              },
            })),
          },
        }],
      },
    },
    {
      width: SIZE,
      height: SIZE,
      fonts: [{
        name: 'Arial Narrow',
        data: fontData,
        weight: 200,
        style: 'normal',
      }],
    }
  );

  // Forward response headers dan body ke res
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  res.send(buffer);
}
