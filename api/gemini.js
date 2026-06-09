// api/gemini.js

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya izinkan GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil parameter text dari query string
  const { text } = req.query;
  if (!text) {
    return res.status(400).json({
      status: 400,
      creator: 'RyodevAPI',
      error: 'Parameter "text" is required'
    });
  }

  // Ambil API key dari environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      status: 500,
      creator: 'RyodevAPI',
      error: 'Server not configured: missing GEMINI_API_KEY'
    });
  }

  try {
    // Gunakan model gemini-3.5-flash (tersedia di daftar model Anda)
    const model = 'gemini-2.5-flash';
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

    return res.status(200).json({
      status: 200,
      creator: 'RyodevAPI',
      model_used: model,
      result: result
    });
  } catch (err) {
    console.error('Gemini API error:', err.message);
    return res.status(500).json({
      status: 500,
      creator: 'RyodevAPI',
      error: err.message
    });
  }
}