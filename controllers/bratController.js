exports.handleBrat = async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({ error: "Teks wajib diisi" });
  }

  try {
    // Simulasi proses generate gambar
    // Di sini lo bisa taruh logika canvas atau fetch ke API lain
    res.setHeader('Content-Type', 'image/png');
    // res.send(imageBuffer); // Uncomment ini pas udah ada buffer gambarnya
    res.send("Ini simulasi hasil gambar untuk: " + text); 
  } catch (error) {
    res.status(500).json({ error: "Gagal memproses gambar" });
  }
};
