export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { surah = '1', ayah, translation = '33' } = req.query;
  if (!surah) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "surah" is required' });
  try {
    if (ayah) {
      const r = await fetch(`https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?language=en&translations=${translation}&audio=7`);
      const j = await r.json();
      const v = j.verse;
      if (!v) throw new Error('Ayah not found');
      return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { surah: Number(surah), ayah: Number(ayah), text: v.text_uthmani, translation: v.translations?.[0]?.text, audio: v.audio_url } });
    }
    const r = await fetch(`https://api.quran.com/api/v4/chapters/${surah}?language=id`);
    const j = await r.json();
    if (!j.chapter) throw new Error('Surah not found');
    const verses = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${surah}?language=id&per_page=5&translations=${translation}`).then(x=>x.json());
    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { chapter: j.chapter, verses: verses.verses?.slice(0,5).map(v=>({ id: v.verse_key, text: v.text_uthmani, translation: v.translations?.[0]?.text })) } });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
