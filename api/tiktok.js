export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });
  try {
    const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const j = await r.json();
    if (j.code !== 0 || !j.data) throw new Error(j.msg || 'Failed to fetch TikTok');
    return res.status(200).json({
      status: 200, creator: 'RyodevAPI',
      result: {
        title: j.data.title,
        author: j.data.author?.nickname || j.data.author,
        music: j.data.music_info?.title || null,
        cover: j.data.cover,
        play: j.data.play,
        hdplay: j.data.hdplay || j.data.play,
        wmplay: j.data.wmplay,
        music_url: j.data.music
      }
    });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
