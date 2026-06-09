export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const text = req.query.text || 'brat';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const len = escaped.length;
  const fontSize = len > 30 ? 48 : len > 20 ? 62 : len > 10 ? 78 : 96;

  const words = escaped.split(' ');
  const maxPerLine = words.length > 3 ? Math.ceil(words.length / 2) : words.length;
  const lines = [];
  for (let i = 0; i < words.length; i += maxPerLine) {
    lines.push(words.slice(i, i + maxPerLine).join(' '));
  }

  const lineHeight = fontSize * 1.25;
  const totalHeight = lines.length * lineHeight;
  const startY = 250 - totalHeight / 2 + lineHeight / 2;

  const textElements = lines.map((line, i) => `
    <text
      x="250" y="${startY + i * lineHeight}"
      text-anchor="middle" dominant-baseline="middle"
      font-family="'Inter', sans-serif"
      font-weight="300" font-size="${fontSize}"
      fill="black" filter="url(#brat-blur)"
    >${line}</text>
  `).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <defs>
      <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300&amp;display=swap');</style>
      <filter id="brat-blur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2"/>
      </filter>
    </defs>
    <rect width="500" height="500" fill="white"/>
    ${textElements}
  </svg>`;

  // Encode ke base64 data URL supaya browser treat sebagai gambar beneran
  const base64 = Buffer.from(svg).toString('base64');
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.json({
    status: 200,
    creator: 'RyodevAPI',
    result: dataUrl,
  });
}
