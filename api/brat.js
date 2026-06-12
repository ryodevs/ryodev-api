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
  const BLUR = 1.8;

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
    if (totalH <= SIZE - PADDING * 2 && maxW <= MAX_WIDTH) break;
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
      font-family="'Arial Narrow', Arial, sans-serif"
      font-weight="900"
      font-size="${fontSize}"
      fill="black"
      filter="url(#blur)"
    >${line}</text>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <defs>
      <filter id="blur" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="${BLUR}"/>
      </filter>
    </defs>
    <rect width="${SIZE}" height="${SIZE}" fill="white"/>
    ${textElements}
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.json({ status: 200, creator: 'RyodevAPI', result: `data:image/svg+xml;base64,${base64}` });
}
