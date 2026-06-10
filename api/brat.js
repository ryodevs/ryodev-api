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

  // Split kata jadi baris berdasarkan panjang karakter estimasi
  const words = escaped.split(' ');
  const lines = [];
  let current = '';

  // Estimasi lebar per karakter relatif terhadap fontSize
  // Kita cari fontSize yang pas dulu, lalu wrap
  function estimateWidth(str, fs) {
    return str.length * fs * 0.55; // estimasi avg char width = 55% fontSize
  }

  // Cari fontSize maksimum yang muat untuk kata terpanjang
  let fontSize = 96;
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');
  while (fontSize > 20 && estimateWidth(longestWord, fontSize) > MAX_WIDTH) {
    fontSize -= 2;
  }

  // Wrap teks ke beberapa baris
  current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (estimateWidth(test, fontSize) > MAX_WIDTH && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  // Kalau masih ada baris yang kepanjangan (kata tunggal panjang), scale down
  for (const line of lines) {
    while (fontSize > 16 && estimateWidth(line, fontSize) > MAX_WIDTH) {
      fontSize -= 2;
    }
  }

  const lineHeight = fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight;
  const startY = SIZE / 2 - totalTextHeight / 2 + lineHeight / 2;

  const textElements = lines.map((line, i) => `
    <text
      x="${SIZE / 2}"
      y="${startY + i * lineHeight}"
      text-anchor="middle"
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
  const dataUrl = `data:image/svg+xml;base64,${base64}`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.json({ status: 200, creator: 'RyodevAPI', result: dataUrl });
}
