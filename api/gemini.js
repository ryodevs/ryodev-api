// api/gemini.js

export default async function handler(req, res) {
  // CORS agar bisa diakses dari frontend manapun
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Tangani preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya izinkan GET (atau bisa juga POST sesuai kebutuhan)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil prompt dari query parameter "text"
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
      error: 'Server not configured: missing GEMINI_API_KEY environment variable'
    });
  }

  try {
    // Model: gemini-3.5-flash (contoh dari curl user)
    const model = 'gemini-3.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const requestBody = {
      contents: [
        {
          parts: [{ text }]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

    return res.status(200).json({
      status: 200,
      creator: 'RyodevAPI',
      model: model,
      result: result
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({
      status: 500,
      creator: 'RyodevAPI',
      error: err.message
    });
  }
}