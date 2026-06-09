import sharp from 'sharp';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const text = req.query.text || 'brat';
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // SVG Template
  const svg = `
  <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white"/>
    <foreignObject x="0" y="0" width="500" height="500">
      <div xmlns="http://www.w3.org/1999/xhtml" style="
        display: flex; align-items: center; justify-content: center;
        width: 500px; height: 500px; padding: 40px; box-sizing: border-box;
        text-align: center; font-family: sans-serif; font-size: 80px; 
        color: black; filter: blur(1.5px); word-wrap: break-word;
      ">
        ${escaped}
      </div>
    </foreignObject>
  </svg>`;

  try {
    // Mengubah SVG menjadi buffer PNG agar browser membacanya sebagai gambar
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.send(pngBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate image' });
  }
}
