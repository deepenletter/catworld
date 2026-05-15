require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { toFile } = require('openai');
const OpenAI = require('openai').default ?? require('openai');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const imageQuality = process.env.OPENAI_IMAGE_QUALITY || 'medium';
const outputFormat = process.env.OPENAI_IMAGE_OUTPUT_FORMAT || 'jpeg';
const outputCompression = outputFormat === 'png'
  ? undefined
  : Math.max(0, Math.min(100, Number(process.env.OPENAI_IMAGE_OUTPUT_COMPRESSION || 82)));

app.use(cors());

function getExtensionFromMimeType(mimeType) {
  return mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
}

function getOutputMimeType() {
  return outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;
}

function reqBodyValue(body, key) {
  return typeof body?.[key] === 'string' ? body[key].trim() : '';
}

function parseStyleTags(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === 'string') : [];
  } catch {
    return [];
  }
}

function buildFaceSwapPrompt(basePrompt, body) {
  const prompt = (basePrompt || '').trim() || [
    'This must remain the same template image.',
    'Keep every template-provided element exactly as it is, keep the template cat in the same role within the scene, and only replace the template cat identity with the user reference cat while preserving the user cat face, breed impression, coat color, and fur markings.',
  ].join(' ');
  const templateTitle = reqBodyValue(body, 'templateTitle');
  const templateDescription = reqBodyValue(body, 'templateDescription');
  const countryName = reqBodyValue(body, 'countryName');
  const styleTags = parseStyleTags(reqBodyValue(body, 'styleTags'));
  const templateReferenceParts = [
    [countryName, templateTitle].filter(Boolean).join(' / '),
    templateDescription,
    styleTags.length ? `Template keywords: ${styleTags.join(', ')}` : '',
  ].filter(Boolean);

  return [
    prompt,
    'Use the first image as the fixed template base image.',
    'Use the second image as the cat identity reference.',
    'This is an identity transfer, not a new scene generation.',
    templateReferenceParts.length
      ? `Template concept reference: ${templateReferenceParts.join(' | ')}`
      : '',
    'Use the template concept reference only to understand the role, styling, mood, and scenario already visible in the template image. Do not invent new scene elements that are not already present in the template.',
    'Follow this process exactly:',
    '1. Lock the template image and preserve every visible template-provided element.',
    '2. Identify what role the template cat is already playing in the template scene and keep that role unchanged.',
    '3. Transfer only the user cat identity traits into that same template cat.',
    '4. Return the same template shot with the same concept, but with the user cat replacing only the cat identity.',
    'Treat the template cat as the pose, action, composition, styling, and concept source.',
    'Treat the reference cat only as the identity source.',
    'Within the masked region, change only the cat identity traits: face shape, ear shape, eyes, muzzle, nose, breed impression, coat colors, fur texture, and markings.',
    'The output cat must keep the exact same pose, body placement, silhouette, viewing direction, limb positioning, tail direction, facial orientation, and relationship to every template-provided element from the template image.',
    'Any accessory, costume, hat, hood, scarf, clothing, prop, furniture, or scene element that already exists in the template must remain in the same place and look the same in the result.',
    'The result should feel like the same photo, same template concept, and same cat role, but with the user cat identity transferred onto it.',
    'Keep the template background, styling, accessories, clothing, props, framing, camera angle, lighting, and every unmasked region unchanged.',
    'Make the final image crisp, clean, photoreal, and sharp while preserving the original template composition.',
    'Do not create a pasted collage. Blend the identity transfer realistically with the template scene.',
  ].filter(Boolean).join('\n');
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

  if (!file) {
    return res.status(400).json({ error: 'file is required.' });
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
            prompt: buildFaceSwapPrompt(prompt, req.body),
            n: 1,
            size: size || 'auto',
            quality: imageQuality,
            output_format: outputFormat,
            ...(outputCompression !== undefined ? { output_compression: outputCompression } : {}),
          });
        })()
      : await openai.images.edit({
          model: imageModel,
          image: imageFile,
          prompt: buildFaceSwapPrompt(prompt, req.body),
          n: 1,
          size: size || '1024x1024',
          quality: imageQuality,
          output_format: outputFormat,
          ...(outputCompression !== undefined ? { output_compression: outputCompression } : {}),
        });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('No edited image was returned from OpenAI.');

    return res.json({ resultUrl: `data:${getOutputMimeType()};base64,${b64}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[generate]', message);
    return res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Render API server listening on port ${PORT}`));
