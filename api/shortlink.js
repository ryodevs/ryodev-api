export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { url } = req.query;
  if (!url) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });
  try {
    const r = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
    const j = await r.json();
    if (j.shorturl) return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { original: url, short: j.shorturl } });
    // fallback tinyurl
    const t = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`).then(x=>x.text());
    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { original: url, short: t } });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
