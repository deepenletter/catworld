require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const { toFile } = require('openai');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/generate', upload.single('file'), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY 환경변수가 없습니다.' });
  }

  const prompt = req.body?.prompt;
  const file = req.file;

  if (!file || !prompt) {
    return res.status(400).json({ error: 'file 또는 prompt 누락' });
  }

  try {
    const mimeType = file.mimetype || 'image/jpeg';
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const imageFile = await toFile(file.buffer, `image.${ext}`, { type: mimeType });

    const response = await openai.images.edit({
      model: 'gpt-image-2',
      image: imageFile,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'medium',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('AI로부터 이미지를 받지 못했습니다.');

    return res.json({ resultUrl: `data:image/png;base64,${b64}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[generate]', msg);
    return res.status(500).json({ error: msg });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Render API server listening on port ${PORT}`));
