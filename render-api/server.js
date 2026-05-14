require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { toFile } = require('openai');
const OpenAI = require('openai').default ?? require('openai');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

app.use(cors());

function getExtensionFromMimeType(mimeType) {
  return mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
}

function buildFaceSwapPrompt(basePrompt) {
  const prompt = (basePrompt || '').trim() || '사용자가 첨부한 사진 속 고양이 얼굴을 템플릿에 그대로 적용해 주세요. 고양이 얼굴 외 다른 요소는 절대 바뀌면 안 되며, 첨부한 고양이의 털과 생김새는 그대로 유지해 주세요.';

  return [
    prompt,
    'Use the first image as the fixed template base image.',
    'Use the second image as the cat identity reference.',
    'Edit only inside the masked cat face area.',
    'Replace only the cat face in the template with the face of the reference cat.',
    'Preserve the reference cat facial structure, fur pattern, markings, colors, eyes, muzzle, nose, ears, and overall likeness as faithfully as possible.',
    'Do not change the template background, body, pose, clothing, props, camera angle, framing, lighting, shadows, or any other element outside the mask.',
    'The output must look like a realistic face swap, not a pasted collage.',
  ].join('\n');
}

async function fetchRemoteFile(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch template image. (${response.status})`);
  }

  const mimeType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, mimeType };
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid mask data.');
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/generate', upload.single('file'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
  }

  const prompt = req.body?.prompt;
  const templateUrl = req.body?.templateUrl;
  const maskDataUrl = req.body?.maskDataUrl;
  const size = req.body?.size;
  const file = req.file;

  if (!file || !prompt) {
    return res.status(400).json({ error: 'file and prompt are required.' });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const mimeType = file.mimetype || 'image/jpeg';
    const ext = getExtensionFromMimeType(mimeType);
    const imageFile = await toFile(file.buffer, `reference.${ext}`, { type: mimeType });

    const isMaskedFaceSwap = Boolean(templateUrl && maskDataUrl);

    const response = isMaskedFaceSwap
      ? await (async () => {
          const remoteTemplate = await fetchRemoteFile(templateUrl);
          const maskFileData = parseDataUrl(maskDataUrl);

          const templateImageFile = await toFile(
            remoteTemplate.buffer,
            `template.${getExtensionFromMimeType(remoteTemplate.mimeType)}`,
            { type: remoteTemplate.mimeType },
          );
          const maskFile = await toFile(maskFileData.buffer, 'mask.png', {
            type: maskFileData.mimeType || 'image/png',
          });

          return openai.images.edit({
            model: imageModel,
            image: [templateImageFile, imageFile],
            mask: maskFile,
            prompt: buildFaceSwapPrompt(prompt),
            n: 1,
            size: size || 'auto',
            quality: 'high',
          });
        })()
      : await openai.images.edit({
          model: imageModel,
          image: imageFile,
          prompt,
          n: 1,
          size: size || '1024x1024',
          quality: 'high',
        });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('No edited image was returned from OpenAI.');

    return res.json({ resultUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[generate]', message);
    return res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Render API server listening on port ${PORT}`));
