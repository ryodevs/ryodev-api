export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "q" is required' });
  }

  try {
    const response = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=1`);
    const data = await response.json();

    const char = data?.data?.[0];
    if (!char) {
      return res.status(404).json({ status: 404, creator: 'RyodevAPI', error: 'Character not found' });
    }

    return res.status(200).json({
      status: 200,
      creator: 'RyodevAPI',
      result: {
        name: char.name,
        nicknames: char.nicknames || [],
        description: char.about?.slice(0, 300) + '...' || '-',
        anime: char.anime?.[0]?.anime?.title || '-',
        image: char.images?.jpg?.image_url || null,
        url: char.url,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
  }
}
