export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "text" is required' });
  }

  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
    const imgRes = await fetch(qrUrl);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return res.status(200).json({
      status: 200,
      creator: 'RyodevAPI',
      result: dataUrl,
    });
  } catch (err) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
  }
}
