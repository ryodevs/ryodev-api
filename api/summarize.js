export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: 'Server not configured' });
  }

  try {
    const fetchPage = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const html = await fetchPage.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);

    if (!text || text.length < 100) {
      throw new Error('Tidak bisa mengambil konten dari URL tersebut');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Ringkas artikel berikut dalam maksimal 5 kalimat poin-poin penting. Bahasa Indonesia yang santai seperti chat WhatsApp:\n\n${text}` }] }],
          generationConfig: { maxOutputTokens: 300, temperature: 0.5 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API Error');

    const result = (data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Gagal merangkum.').trim();

    return res.status(200).json({ status: 200, creator: 'RyodevAPI', url, result });
  } catch (err) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
  }
}
