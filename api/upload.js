export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.query;
  if (!url) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });

  try {
    // Fetch gambar dari URL
    const imgRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!imgRes.ok) throw new Error('Gagal mengambil gambar dari URL');

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Detect ekstensi
    const ext = contentType.includes('png') ? 'png'
      : contentType.includes('gif') ? 'gif'
      : contentType.includes('webp') ? 'webp'
      : 'jpg';

    // Upload ke catbox.moe
    const form = new FormData();
    const blob = new Blob([buffer], { type: contentType });
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', blob, `image.${ext}`);

    const uploadRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
    });

    const result = await uploadRes.text();

    if (!result.startsWith('https://')) {
      throw new Error('Upload gagal: ' + result);
    }

    return res.status(200).json({
      status: 200,
      creator: 'RyodevAPI',
      original: url,
      result: result.trim(),
    });

  } catch (err) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
  }
}
