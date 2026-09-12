export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });
  try {
    const id = url.match(/(?:v=|youtu\.be\/|shorts\/)([^&?/]+)/)?.[1] || url;
    const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`).then(r=>r.json()).catch(()=>null);
    // use y2mate api fallback via no-key invidious
    const r = await fetch(`https://api.qewertyy.dev/youtube?url=${encodeURIComponent(url)}`);
    const j = await r.json().catch(()=>null);
    if (j && j.data) return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: j.data });
    if (oembed) return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { title: oembed.title, author: oembed.author_name, thumbnail: oembed.thumbnail_url, url: `https://www.youtube.com/watch?v=${id}` } });
    throw new Error('Failed to fetch YouTube');
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
