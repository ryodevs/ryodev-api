export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { q = 'indonesia', limit = '10' } = req.query;
  try {
    const r = await fetch(`https://api-berita-indonesia.vercel.app/${encodeURIComponent(q)}/terbaru`);
    const j = await r.json();
    if (j.data?.posts) return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: j.data.posts.slice(0, Number(limit)) });
    // fallback to HackerNews
    const hn = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&hitsPerPage=${limit}`).then(x=>x.json());
    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: hn.hits.map(h=>({ title: h.title, url: h.url, points: h.points, author: h.author })) });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
