export default async function handler(req, res) {
  // Setup Header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  // Ambil teks dari query
  const text = req.query.text || 'brat';
  
  // Sanitasi teks untuk XML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Logika ukuran font responsif
  const len = escaped.length;
  const fontSize = len > 60 ? 35 : len > 40 ? 50 : len > 20 ? 70 : 90;

  // Template SVG dengan foreignObject
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400&amp;display=swap');
    </style>
  </defs>
  
  <rect width="100%" height="100%" fill="white"/>
  
  <foreignObject x="0" y="0" width="500" height="500">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 500px;
      height: 500px;
      padding: 40px;
      box-sizing: border-box;
      text-align: center;
      font-family: 'Inter', sans-serif;
      font-weight: 400;
      font-size: ${fontSize}px;
      color: black;
      filter: blur(1.5px);
      word-wrap: break-word;
      word-break: break-word;
      white-space: pre-wrap;
      line-height: 1.1;
    ">
      ${escaped}
    </div>
  </foreignObject>
</svg>`;

  res.send(svg);
}
