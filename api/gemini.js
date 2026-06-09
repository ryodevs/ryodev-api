// api/gemini.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.query;
  if (!text) {
    return res.status(400).json({
      status: 400,
      creator: 'RyodevAPI',
      error: 'Parameter "text" is required'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      status: 500,
      creator: 'RyodevAPI',
      error: 'Server not configured: missing GEMINI_API_KEY'
    });
  }

  // Daftar model yang dicoba secara berurutan
  const models = ['gemini-3.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }]
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        return res.status(200).json({
          status: 200,
          creator: 'RyodevAPI',
          model_used: model,
          result
        });
      }

      // Tangani error khusus high demand atau model not found
      const errorMsg = data.error?.message || '';
      if (errorMsg.includes('high demand') || errorMsg.includes('not found')) {
        lastError = errorMsg;
        continue; // coba model berikutnya
      } else {
        // Error lain langsung stop
        throw new Error(errorMsg);
      }
    } catch (err) {
      lastError = err.message;
      // Jika error jaringan atau lainnya, lanjut coba model lain
      continue;
    }
  }

  // Jika semua model gagal
  return res.status(500).json({
    status: 500,
    creator: 'RyodevAPI',
    error: `All models failed. Last error: ${lastError}`
  });
}