import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST: upload file dari browser
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
      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', buffer, {
        filename: file.originalFilename || 'image.jpg',
        contentType: file.mimetype || 'image/jpeg',
      });

      const uploadRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: fd.getHeaders(),
        body: fd.getBuffer(),
      });

      const resultUrl = await uploadRes.text();
      if (!resultUrl.startsWith('https://')) throw new Error('Upload gagal: ' + resultUrl);

      return res.status(200).json({
        status: 200,
        creator: 'RyodevAPI',
        result: resultUrl.trim(),
      });
    } catch (err) {
      return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
    }
  }

  // GET: upload dari URL
  if (req.method === 'GET') {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });

    try {
      const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!imgRes.ok) throw new Error('Gagal mengambil gambar dari URL');

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : contentType.includes('webp') ? 'webp' : 'jpg';

      const fd = new FormData();
      fd.append('reqtype', 'fileupload');
      fd.append('fileToUpload', buffer, { filename: `image.${ext}`, contentType });

      const uploadRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        headers: fd.getHeaders(),
        body: fd.getBuffer(),
      });

      const resultUrl = await uploadRes.text();
      if (!resultUrl.startsWith('https://')) throw new Error('Upload gagal: ' + resultUrl);

      return res.status(200).json({ status: 200, creator: 'RyodevAPI', original: url, result: resultUrl.trim() });
    } catch (err) {
      return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
