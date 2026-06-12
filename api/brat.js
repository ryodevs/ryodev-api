import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get('text') || 'brat').toLowerCase();

  const SIZE = 500;
  const PADDING = 32;
  const MAX_WIDTH = SIZE - PADDING * 2;

  // Estimasi font size yang pas
  function estimateWidth(str, fs) {
    return str.length * fs * 0.5;
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
  let fontSize = 150;
  let lines = [];

  while (fontSize > 16) {
    lines = wrapText(words, fontSize);
    const totalH = lines.length * fontSize * 1.0;
    const maxW = Math.max(...lines.map(l => estimateWidth(l, fontSize)));
    if (totalH <= SIZE - PADDING * 2 && maxW <= MAX_WIDTH) break;
    fontSize -= 4;
  }

  const multiLine = lines.length > 1;

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: SIZE,
          height: SIZE,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: multiLine ? 'flex-start' : 'center',
          padding: multiLine ? `0 ${PADDING}px` : '0',
        },
        children: lines.map((line, i) => ({
          type: 'div',
          props: {
            key: i,
            style: {
              fontSize,
              fontWeight: 900,
              fontFamily: 'Arial',
              color: 'black',
              lineHeight: 1.0,
              filter: 'blur(1.8px)',
              letterSpacing: '-0.02em',
            },
            children: line,
          },
        })),
      },
    },
    { width: SIZE, height: SIZE }
  );
}
