export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const text = req.query.text || 'brat';
  
  // Membersihkan teks untuk mencegah error XML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Logika font size otomatis berdasarkan panjang teks
  const len = escaped.length;
  const fontSize = len > 50 ? 40 : len > 30 ? 60 : len > 15 ? 80 : 100;

  // Menggunakan foreignObject agar teks bisa wrap otomatis via CSS
  const svg = `
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
        width: 100%;
        height: 100%;
        padding: 40px;
        box-sizing: border-box;
        text-align: center;
        font-family: 'Inter', sans-serif;
        font-weight: 400;
        font-size: ${fontSize}px;
        line-height: 1.1;
        color: black;
        filter: blur(1.5px);
        word-wrap: break-word;
        overflow-wrap: break-word;
        white-space: pre-wrap;
      ">
        ${escaped}
      </div>
    </foreignObject>
  </svg>`;

  res.send(svg);
}
