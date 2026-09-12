export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { city } = req.query;
  if (!city) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "city" is required' });
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`).then(r=>r.json());
    const loc = geo.results?.[0];
    if (!loc) throw new Error('City not found');
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Jakarta`).then(r=>r.json());
    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: { city: loc.name, country: loc.country, latitude: loc.latitude, longitude: loc.longitude, current: w.current, daily: w.daily } });
  } catch (e) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: e.message });
  }
}
