import crypto from "node:crypto";
import FormData from "form-data";

const BASE_URL = "https://app.remini.ai";
const URL_USER = "/api/v1/web/users";
const URL_BULK = "/api/v1/web/tasks/bulk-upload";
const URL_APPROVAL = "/api/v1/web/tasks/bulk-upload/BULK_UPLOAD_ID/process";
const URL_TASK = "/api/v1/web/tasks/bulk-upload/";

const BASE_URL_WM = "https://api.watermarkremover.io";
const URL_REMOVE_WM = "/service/public/transformation/v1.0/predictions/wm/remove";
const URL_SECRET = "https://api.pixelbin.io/service/public/transformation/v1.0/predictions/wm/remove";
const SIGN_KEY = "A4nzUYcDOZ";

const shaderTypes = ["FRAGMENT_SHADER", "VERTEX_SHADER"];
const precisionLevels = ["LOW_FLOAT", "MEDIUM_FLOAT", "HIGH_FLOAT", "LOW_INT", "MEDIUM_INT", "HIGH_INT"];
const extensions = [
  "ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_clip_control",
  "EXT_color_buffer_half_float", "EXT_depth_clamp", "EXT_disjoint_timer_query",
  "OES_texture_float", "OES_texture_half_float", "WEBGL_draw_buffers"
];
const extensionParams = [
  "COLOR_ATTACHMENT0_WEBGL=36064", "COMPRESSED_RGBA_S3TC_DXT1_EXT=33777",
  "DEPTH_CLAMP_EXT=34383", "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT=33296",
  "TEXTURE_MAX_ANISOTROPY_EXT=34046=16"
];

const BULK_PAYLOAD = (settings) => ({
  input_task_list: [{
    image_content_type: "image/jpeg",
    output_content_type: "image/jpeg",
    ai_pipeline: settings
  }]
});

const DEFAULT_SETTINGS = {
  face_enhance: { model: "remini" },
  background_enhance: { model: "rhino-tensorrt" },
  bokeh: {
    aperture_radius: "0", highlights: "0.20", vivid: "0.75",
    group_picture: "true", rescale_kernel_for_small_images: "true", apply_front_bokeh: "false"
  },
  jpeg_quality: 90
};

let k = [2277735313, 289559509];
let I = [1291169091, 658871167];
let P = [0, 5];
let C = [0, 1390208809];
let A = [0, 944331445];
let E = [4283543511, 3981806797];
let S = [3301882366, 444984403];

function randomChar(length = 5) {
  const chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  return Array.from({ length }).map(_ => chr.charAt(Math.floor(Math.random() * chr.length))).join("");
}

function generateRandomMathValues() {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 10;
  return {
    acos: Math.acos(Math.abs(x)), acosh: Math.acosh(y + 1), acoshPf: Math.acosh(y + 1),
    asin: Math.asin(x), asinh: Math.asinh(x), asinhPf: Math.asinh(x),
    atanh: Math.atanh(x * 0.9), atanhPf: Math.atanh(x * 0.9), atan: Math.atan(x),
    sin: Math.sin(y), sinh: Math.sinh(y), sinhPf: Math.sinh(y * 0.5),
    cos: Math.cos(y), cosh: Math.cosh(y), coshPf: Math.cosh(y),
    tan: Math.tan(y), tanh: Math.tanh(y), tanhPf: Math.tanh(y),
    exp: Math.exp(x), expm1: Math.expm1(x), expm1Pf: Math.expm1(x),
    log1p: Math.log1p(y), log1pPf: Math.log1p(y), powPI: Math.pow(Math.PI, -y)
  };
}

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateShaderPrecisions = () =>
  shaderTypes.flatMap(type =>
    precisionLevels.map(level => `${type}.${level}=${getRandomNumber(10,200)},${getRandomNumber(10,200)},${getRandomNumber(0,50)}`)
  );

const generateExtensions = () =>
  extensions.sort(() => Math.random() - 0.5).slice(0, getRandomNumber(5, extensions.length));

const generateExtensionParameters = () =>
  extensionParams.sort(() => Math.random() - 0.5).slice(0, getRandomNumber(3, extensionParams.length));

const generateDummyData = () => ({
  shaderPrecisions: generateShaderPrecisions(),
  extensions: generateExtensions(),
  extensionParameters: generateExtensionParameters()
});

function getRandomParameter() {
  const keys = ["ACTIVE_ATTRIBUTES","ACTIVE_TEXTURE","ACTIVE_UNIFORMS","ALIASED_LINE_WIDTH_RANGE","ALIASED_POINT_SIZE_RANGE","ALPHA","ALPHA_BITS","ALWAYS","ARRAY_BUFFER","ARRAY_BUFFER_BINDING","ATTACHED_SHADERS","BACK","BLEND","BLEND_COLOR","BLEND_DST_ALPHA","BLEND_DST_RGB","BLEND_EQUATION","BLEND_EQUATION_ALPHA","BLEND_EQUATION_RGB","BLEND_SRC_ALPHA","BLEND_SRC_RGB","BLUE_BITS","BOOL","BOOL_VEC2","BOOL_VEC3","BOOL_VEC4","BROWSER_DEFAULT_WEBGL"];
  const key = keys[Math.floor(Math.random() * keys.length)];
  const value = Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : `${Math.floor(Math.random() * 1000)},${Math.floor(Math.random() * 1000)}`;
  return `"${key}=${value}"`;
}

function generateRandomParameters(count = 10) {
  const parameters = [];
  for (let i = 0; i < count; i++) parameters.push(getRandomParameter());
  return `{\n  "parameters": [\n    ${parameters.join(",\n    ")}\n  ]\n}`;
}

function getComponents() {
  return {
    colorDepth: Math.floor(Math.random() * 24),
    colorGamut: ["srgb", "rgb", "rgba"][Math.floor(Math.random() * 2)],
    cookiesEnabled: true,
    deviceMemory: Math.floor(Math.random() * 24),
    fontPreferences: { default: Math.random() * 247.9999, serif: Math.random() * 973.1287, sans: Math.random() * 778.1238, mono: Math.random() * 87.918351 },
    hardwareConcurrency: Math.floor(Math.random() * 12),
    languages: [["id-ID","en-EN","us-US","eu-EU"][Math.floor(Math.random() * 3)]],
    localStorage: true,
    math: generateRandomMathValues(),
    platform: ["Win32","Win64","Linux","MacOS"][Math.floor(Math.random() * 4)],
    screenResolution: [Math.random() * 4090, Math.random() * 3090],
    sessionStorage: true,
    timezone: "Asia/Jakarta",
    touchSupport: { maxTouchPoints: 0, touchEvent: false, touchStart: false },
    vendor: randomChar(10),
    vendorFlavors: ["chrome"],
    webGlBasics: {
      version: "WebGL 1.0 (OpenGL ES 2.0 Chromium)",
      vendor: "WebKit",
      vendorUnmasked: `${randomChar(10)} (NVIDIA)`,
      renderer: "WebKit WebGL",
      rendererUnmasked: `ANGLE (NVIDIA, NVIDIA GeForce RTX ${["3090","4090","5090","360","450","720"][Math.floor(Math.random() * 6)]} Direct3D11 vs_5_0 ps_5_0, D3D11)`,
      shadingLanguageVersion: "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)"
    },
    webGlExtensions: {
      parameters: generateRandomParameters(15),
      ...generateDummyData(),
      unsupportedExtensions: []
    }
  };
}

function _(e, t) { if ((t %= 64) !== 0) { if (t < 32) { e[0] = e[1] >>> 32 - t; e[1] = e[1] << t; } else { e[0] = e[1] << t - 32; e[1] = 0; } } }
function b(e, t) { let n=e[0]>>>16,r=e[0]&65535,o=e[1]>>>16,i=e[1]&65535,a=t[0]>>>16,s=t[0]&65535,l=t[1]>>>16,u=t[1]&65535,c=0,d=0,f=0,p=0; f+=(p+=i*u)>>>16; p&=65535; d+=(f+=o*u)>>>16; f&=65535; d+=(f+=i*l)>>>16; f&=65535; c+=(d+=r*u)>>>16; d&=65535; c+=(d+=o*l)>>>16; d&=65535; c+=(d+=i*s)>>>16; d&=65535; c+=n*u+r*l+o*s+i*a; c&=65535; e[0]=c<<16|d; e[1]=f<<16|p; }
function w(e, t) { let n=e[0]; if ((t%=64)===32) { e[0]=e[1]; e[1]=n; } else if (t<32) { e[0]=n<<t|e[1]>>>32-t; e[1]=e[1]<<t|n>>>32-t; } else { t-=32; e[0]=e[1]<<t|n>>>32-t; e[1]=n<<t|e[1]>>>32-t; } }
function x(e, t) { e[0]^=t[0]; e[1]^=t[1]; }
function y(e, t) { let n=e[0]>>>16,r=e[0]&65535,o=e[1]>>>16,i=e[1]&65535,a=t[0]>>>16,s=t[0]&65535,l=t[1]>>>16,u=0,c=0,d=0,f=0; d+=(f+=i+(t[1]&65535))>>>16; f&=65535; c+=(d+=o+l)>>>16; d&=65535; u+=(c+=r+s)>>>16; c&=65535; u+=n+a; u&=65535; e[0]=u<<16|c; e[1]=d<<16|f; }
function O(e) { let t=[0,e[0]>>>1]; x(e,t); b(e,E); t[1]=e[0]>>>1; x(e,t); b(e,S); t[1]=e[0]>>>1; x(e,t); }

function _encrypt(e) {
  let n = (function(e) { let t=new Uint8Array(e.length); for(let n=0;n<e.length;n++){let r=e.charCodeAt(n); if(r>127) return new TextEncoder().encode(e); t[n]=r;} return t; })(e);
  let t=0,r,o=[0,n.length],i=o[1]%16,a=o[1]-i,s=[0,t],l=[0,t],u=[0,0],c=[0,0];
  for(r=0;r<a;r+=16){u[0]=n[r+4]|n[r+5]<<8|n[r+6]<<16|n[r+7]<<24;u[1]=n[r]|n[r+1]<<8|n[r+2]<<16|n[r+3]<<24;c[0]=n[r+12]|n[r+13]<<8|n[r+14]<<16|n[r+15]<<24;c[1]=n[r+8]|n[r+9]<<8|n[r+10]<<16|n[r+11]<<24;b(u,k);w(u,31);b(u,I);x(s,u);w(s,27);y(s,l);b(s,P);y(s,C);b(c,I);w(c,33);b(c,k);x(l,c);w(l,31);y(l,s);b(l,P);y(l,A);}
  u[0]=0;u[1]=0;c[0]=0;c[1]=0;let d=[0,0];
  switch(i){case 15:d[1]=n[r+14];_(d,48);x(c,d);case 14:d[1]=n[r+13];_(d,40);x(c,d);case 13:d[1]=n[r+12];_(d,32);x(c,d);case 12:d[1]=n[r+11];_(d,24);x(c,d);case 11:d[1]=n[r+10];_(d,16);x(c,d);case 10:d[1]=n[r+9];_(d,8);x(c,d);case 9:d[1]=n[r+8];x(c,d);b(c,I);w(c,33);b(c,k);x(l,c);case 8:d[1]=n[r+7];_(d,56);x(u,d);case 7:d[1]=n[r+6];_(d,48);x(u,d);case 6:d[1]=n[r+5];_(d,40);x(u,d);case 5:d[1]=n[r+4];_(d,32);x(u,d);case 4:d[1]=n[r+3];_(d,24);x(u,d);case 3:d[1]=n[r+2];_(d,16);x(u,d);case 2:d[1]=n[r+1];_(d,8);x(u,d);case 1:d[1]=n[r];x(u,d);b(u,k);w(u,31);b(u,I);x(s,u);}
  x(s,o);x(l,o);y(s,l);y(l,s);O(s);O(l);y(s,l);y(l,s);
  return ("00000000"+(s[0]>>>0).toString(16)).slice(-8)+("00000000"+(s[1]>>>0).toString(16)).slice(-8)+("00000000"+(l[0]>>>0).toString(16)).slice(-8)+("00000000"+(l[1]>>>0).toString(16)).slice(-8);
}

function _objToStr(e) {
  let t = "";
  for (let n=0,r=Object.keys(e).sort();n<r.length;n++) {
    const o=r[n],i=e[o],a=typeof i=="string"?i:JSON.stringify(i);
    t+=`${t?"|":""}${o.replace(/([:|\\])/g,"\\$1")}:${a}`;
  }
  return t;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function getUserAgent() {
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

async function doReq(url, method = "GET", data = null, headers = null) {
  const res = await fetch(url, {
    method,
    headers: headers || {
      "accept": "*/*",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8",
      "content-type": "application/json",
      "origin": "https://app.remini.ai",
      "referer": "https://app.remini.ai/",
      "user-agent": getUserAgent()
    },
    ...(data ? { body: data } : {})
  });
  return res;
}

async function initToken() {
  const res = await doReq(BASE_URL + URL_USER, "POST");
  const json = await res.json();
  return json.access_token;
}

async function processRemini(imgBuffer) {
  const token = await initToken();
  const authHeaders = {
    "accept": "*/*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8",
    "content-type": "application/json",
    "authorization": `Bearer ${token}`,
    "origin": "https://app.remini.ai",
    "referer": "https://app.remini.ai/",
    "user-agent": getUserAgent()
  };

  // Upload task
  const uploadRes = await fetch(BASE_URL + URL_BULK, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(BULK_PAYLOAD(DEFAULT_SETTINGS))
  });
  const uploadData = await uploadRes.json();

  // Send image to GCS
  const gcsHeaders = {
    "content-type": "image/jpeg",
    "x-goog-custom-time": uploadData.task_list[0].upload_headers["x-goog-custom-time"],
    "user-agent": getUserAgent()
  };
  await fetch(uploadData.task_list[0].upload_url, {
    method: "PUT",
    headers: gcsHeaders,
    body: imgBuffer
  });

  // Approve
  await fetch(BASE_URL + URL_APPROVAL.replace("BULK_UPLOAD_ID", uploadData.bulk_upload_id), {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(BULK_PAYLOAD(DEFAULT_SETTINGS))
  });

  // Poll for result (max 60s)
  let taskResult = null;
  let hasWatermark = false;
  for (let i = 0; i < 30; i++) {
    await delay(2000);
    const taskRes = await fetch(BASE_URL + URL_TASK + uploadData.bulk_upload_id, {
      headers: authHeaders
    });
    const taskData = await taskRes.json();
    if (taskData.task_list[0].status === "completed") {
      taskResult = taskData.task_list[0].result.outputs[0];
      hasWatermark = taskResult.has_watermark;
      break;
    }
  }

  if (!taskResult) return null;

  // Hapus watermark kalau ada, lalu upload ke tmpfiles biar bisa diakses
  if (hasWatermark) {
    try {
      const noWmUrl = await removeWatermark(taskResult.url);
      if (noWmUrl) {
        // Upload hasil no-watermark ke tmpfiles biar tidak kena hotlink block
        const imgRes = await fetch(noWmUrl, { headers: { 'User-Agent': getUserAgent() }, redirect: 'follow' });
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const fd = new FormData();
        fd.append('file', buffer, { filename: 'result.jpg', contentType: 'image/jpeg' });
        const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', headers: fd.getHeaders(), body: fd.getBuffer() });
        const uploadJson = await uploadRes.json();
        if (uploadJson?.data?.url) {
          return uploadJson.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
        }
        return noWmUrl;
      }
    } catch (_) {}
  }

  return taskResult.url;
}

async function removeWatermark(imageUrl) {
  const uri = new URL(URL_SECRET);
  const iso = new Date().toISOString();
  const params = Buffer.from(iso).toString("base64");

  // Generate visitor ID buat signature
  const visitorId = crypto.randomBytes(16).toString("hex");
  const hm = `POST${encodeURI(uri.pathname + uri.search)}${iso}${visitorId}`;
  const sig = crypto.createHmac("sha256", SIGN_KEY).update(hm).digest("hex");

  const wmHeaders = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "id-ID,id;q=0.9,en-US;q=0.8",
    "origin": "https://www.watermarkremover.io",
    "referer": "https://www.watermarkremover.io/",
    "user-agent": getUserAgent(),
    "x-ebg-param": params,
    "x-ebg-signature": sig,
    "pixb-cl-id": visitorId,
  };

  // Fetch image
  const imgRes = await fetch(imageUrl, { headers: { "user-agent": getUserAgent() } });
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  const form = new FormData();
  form.append("input.image", buffer, { filename: `${crypto.randomUUID()}.jpg`, contentType: "image/jpeg" });
  form.append("input.rem_text", "false");
  form.append("input.rem_logo", "false");
  form.append("retention", "1d");

  const uploadRes = await fetch("https://api.watermarkremover.io" + URL_REMOVE_WM, {
    method: "POST",
    headers: { ...wmHeaders, ...form.getHeaders() },
    body: form.getBuffer(),
  });

  const json = await uploadRes.json();
  if (!json?.urls?.get) return null;

  // Poll result
  const pollHeaders = { origin: "https://www.watermarkremover.io", referer: json.urls.get, "user-agent": getUserAgent() };
  for (let i = 0; i < 20; i++) {
    await delay(3000);
    const pollRes = await fetch(json.urls.get, { headers: pollHeaders });
    const pollData = await pollRes.json();
    if (pollData?.status === "SUCCESS") return pollData.output?.[0] || null;
  }

  return null;
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let imageBuffer = null;

  try {
    if (req.method === 'POST') {
      const { IncomingForm } = await import('formidable');
      const { default: fs } = await import('fs');
      const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });
      const { files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'No file uploaded' });
      imageBuffer = fs.readFileSync(file.filepath);
    } else if (req.method === 'GET') {
      const url = req.query.url;
      if (!url) return res.status(400).json({ status: 400, creator: 'RyodevAPI', error: 'Parameter "url" is required' });
      const imgRes = await fetch(url, { headers: { 'User-Agent': getUserAgent() } });
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const result = await processRemini(imageBuffer);
    if (!result) {
      return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: 'Processing failed or timed out' });
    }

    // Proxy gambar hasilnya
    try {
      const imgRes = await fetch(result, {
        headers: { 'User-Agent': getUserAgent(), 'Referer': 'https://app.remini.ai/' },
        redirect: 'follow',
      });
      const contentType = imgRes.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const base64 = buffer.toString('base64');
        return res.status(200).json({ status: 200, creator: 'RyodevAPI', result: `data:${contentType};base64,${base64}` });
      }
    } catch (_) {}

    return res.status(200).json({ status: 200, creator: 'RyodevAPI', result });
  } catch (err) {
    return res.status(500).json({ status: 500, creator: 'RyodevAPI', error: err.message });
  }
}
