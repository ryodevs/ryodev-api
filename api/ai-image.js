export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, width = '512', height = '512' } = req.query;
  if (!prompt) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "prompt" is required' });
  try {
    const url = `https://image.pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true`;
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await r.arrayBuffer());
    const ct = r.headers.get('content-type') || 'image/jpeg';
    const b64 = buf.toString('base64');
    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: `data:${ct};base64,${b64}` });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
