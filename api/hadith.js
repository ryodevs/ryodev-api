export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { book = 'bukhari', number = '1' } = req.query;
  try {
    // primary: gading.dev, fallback: fawazahmed cdn
    const ctrl = new AbortController(); setTimeout(()=>ctrl.abort(), 5000);
    try {
      const r = await fetch(`https://api.hadith.gading.dev/books/${book}?range=${number}-${number}`, { signal: ctrl.signal });
      const j = await r.json();
      const d = j.data?.[0] || j.data;
      if (d) return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { book, number, arab: d.arab, indonesian: d.id } });
    } catch {}
    const r2 = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${book}/${number}.json`, { signal: ctrl.signal }).catch(()=>null);
    if (r2 && r2.ok) {
      const j2 = await r2.json();
      if (j2.text) return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { book, number, arab: j2.text, english: j2.text } });
    }
    throw new Error('Hadith not found — try book=bukhari|muslim & number=1');
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
