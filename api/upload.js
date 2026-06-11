import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: { bodyParser: false }
};

async function uploadToHost(buffer, filename, mimetype) {
  // Coba tmpfiles.org
  try {
    const fd = new FormData();
    fd.append('file', buffer, { filename, contentType: mimetype });
    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      headers: fd.getHeaders(),
      body: fd.getBuffer(),
    });
    const json = await res.json();
    if (json?.data?.url) {
      // tmpfiles return url seperti https://tmpfiles.org/1234/file.jpg
      // convert ke direct link
      const direct = json.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      return direct;
    }
  } catch (_) {}

  // Fallback: catbox dengan format yang bener
  try {
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('userhash', '');
    fd.append('fileToUpload', buffer, { filename, contentType: mimetype });
    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      headers: fd.getHeaders(),
      body: fd.getBuffer(),
    });
    const text = await res.text();
    if (text.startsWith('https://')) return text.trim();
  } catch (_) {}

  throw new Error('Semua host gagal, coba lagi nanti');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: file dari browser
  if (req.method === 'POST') {
    try {
      const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
      const { files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'No file uploaded' });

      const buffer = fs.readFileSync(file.filepath);
      const result = await uploadToHost(buffer, file.originalFilename || 'image.jpg', file.mimetype || 'image/jpeg');

      return res.status(200).json({ status: 200, creator: 'RyodevAPI', result });
    } catch (err) {
      return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
    }
  }

  // GET: dari URL
  if (req.method === 'GET') {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });

    try {
      const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!imgRes.ok) throw new Error('Gagal mengambil gambar dari URL');

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : contentType.includes('webp') ? 'webp' : 'jpg';

      const result = await uploadToHost(buffer, `image.${ext}`, contentType);
      return res.status(200).json({ status: 200, creator: 'RyodevAPI', original: url, result });
    } catch (err) {
      return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
