export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { text, from = 'auto', to } = req.query;
  if (!text) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "text" is required' });
  if (!to) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "to" is required (e.g. id, en, ja, ko)' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: 'Server not configured' });

  const langNames = {
    id: 'Indonesian', en: 'English', ja: 'Japanese', ko: 'Korean',
    zh: 'Chinese', ar: 'Arabic', fr: 'French', de: 'German',
    es: 'Spanish', pt: 'Portuguese', ru: 'Russian', it: 'Italian',
    th: 'Thai', vi: 'Vietnamese', ms: 'Malay',
  };

  const toLang = langNames[to] || to;
  const fromLang = langNames[from] || from;
  const prompt = from === 'auto'
    ? `Translate the following text to ${toLang}. Only return the translated text, nothing else:\n\n${text}`
    : `Translate the following text from ${fromLang} to ${toLang}. Only return the translated text, nothing else:\n\n${text}`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1000, temperature: 0.1 }
          })
        }
      );
      const data = await response.json();
      if (response.ok) {
        const result = (data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Translation failed.').trim();
        return res.status(200).json({ status: 200, creator: 'RyodevAPI', from: from === 'auto' ? 'auto' : from, to, original: text, result });
      }
      lastError = data.error?.message || '';
      if (!lastError.includes('high demand') && !lastError.includes('not found') && !lastError.includes('quota')) break;
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: lastError || 'All models failed' });
}
