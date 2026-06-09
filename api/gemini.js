// api/gemini.js

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

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
      error: 'Server not configured: missing API key'
    });
  }

  try {
    // Gunakan model yang paling kompatibel: gemini-pro
    const model = 'gemini-pro';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    return res.status(200).json({
      status: 200,
      creator: 'RyodevAPI',
      result
    });
  } catch (err) {
    return res.status(500).json({
      status: 500,
      creator: 'RyodevAPI',
      error: err.message
    });
  }
}