export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { top = ' ', bottom = ' ', template = 'drake' } = req.query;
  try {
    // memegen.link free
    const url = `https://api.memegen.link/images/${encodeURIComponent(template)}/${encodeURIComponent(top || ' ')}/${encodeURIComponent(bottom || ' ')}.png`;
    const r = await fetch(url);
    const buf = Buffer.from(await r.arrayBuffer());
    const b64 = buf.toString('base64');
    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: `data:image/png;base64,${b64}` });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
