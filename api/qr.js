export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "text" is required' });
  }

  const encoded = encodeURIComponent(text);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;

  return res.status(200).json({
    status: 200,
    creator: 'RyodevAPI',
    result: qrUrl,
  });
}
