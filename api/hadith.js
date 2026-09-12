export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { book = 'bukhari', number = '1' } = req.query;
  try {
    const r = await fetch(`https://api.hadith.gading.dev/books/${book}?range=${number}-${number}`);
    const j = await r.json();
    const d = j.data?.[0] || j.data;
    if (!d) throw new Error('Hadith not found');
    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { book, number, arab: d.arab, indonesian: d.id, english: d.en } });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
