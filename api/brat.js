export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const text = req.query.text || 'brat';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const SIZE = 500;
  const PADDING = 40;
  const MAX_WIDTH = SIZE - PADDING * 2;
  const MAX_HEIGHT = SIZE - PADDING * 2;

  function estimateWidth(str, fs) {
    return str.length * fs * 0.55;
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
  let fontSize = 96;

  // Turunkan fontSize sampai semua teks muat horizontal DAN vertikal
  let lines = [];
  while (fontSize > 16) {
    lines = wrapText(words, fontSize);
    const totalHeight = lines.length * fontSize * 1.25;
    const maxLineWidth = Math.max(...lines.map(l => estimateWidth(l, fontSize)));
    if (totalHeight <= MAX_HEIGHT && maxLineWidth <= MAX_WIDTH) break;
    fontSize -= 2;
  }

  const multiLine = lines.length > 1;
  const lineHeight = fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;
  const startY = SIZE / 2 - totalTextHeight / 2 + lineHeight / 2;

  const textX = multiLine ? PADDING : SIZE / 2;
  const textAnchor = multiLine ? 'start' : 'middle';

  const textElements = lines.map((line, i) => `
    <text
      x="${textX}"
      y="${startY + i * lineHeight}"
      text-anchor="${textAnchor}"
      dominant-baseline="middle"
      font-family="'Inter', sans-serif"
      font-weight="400"
      font-size="${fontSize}"
      fill="black"
      filter="url(#brat-blur)"
    >${line}</text>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <defs>
      <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400&amp;display=swap');</style>
      <filter id="brat-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.8"/>
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
