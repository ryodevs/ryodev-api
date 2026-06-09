const { createCanvas, registerFont } = require('canvas');

exports.handleBrat = async (req, res) => {
  const text = req.query.text || 'BRAT';

  try {
    // 1. Setup Canvas (Ukuran 500x500)
    const width = 500;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 2. Background (Warna khas Brat: Lime Green #8ACE00)
    ctx.fillStyle = '#8ACE00';
    ctx.fillRect(0, 0, width, height);

    // 3. Setup Teks
    ctx.fillStyle = 'black';
    ctx.font = 'bold 80px Arial'; // Lo bisa ganti font kalo mau
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 4. Gambar Teks di tengah
    ctx.fillText(text.toUpperCase(), width / 2, height / 2);

    // 5. Kirim sebagai Gambar
    const buffer = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal generate gambar" });
  }
};
