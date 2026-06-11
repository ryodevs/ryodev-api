export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const imgRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://app.remini.ai/',
      },
      redirect: 'follow',
    });

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!contentType.includes('image')) {
      return res.status(400).json({ error: 'Not an image' });
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
