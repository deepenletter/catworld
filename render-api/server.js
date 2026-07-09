require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { toFile } = require('openai');
const OpenAI = require('openai').default ?? require('openai');
const { list, put } = require('@vercel/blob');

const app = express();

// ─── 전역 일일 예산 상한 (Vercel Blob 공유 카운터) ────────────────────────────
// Next의 src/lib/dailyBudget.ts와 같은 저장 경로/키를 사용해 두 배포가 카운터를 공유한다.
// BLOB_READ_WRITE_TOKEN이 없거나 오류면 fail-open(생성을 막지 않음).
const BUDGET_PREFIX = 'catworld-budget';
const DEFAULT_DAILY_BUDGET_LIMIT = 60;
const DEFAULT_BUDGET_TIMEZONE = 'Asia/Seoul';

function getBudgetLimit() {
  const raw = Number(process.env.DAILY_BUDGET_LIMIT || DEFAULT_DAILY_BUDGET_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_DAILY_BUDGET_LIMIT;
  return Math.max(1, Math.floor(raw));
}

function getBudgetDayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.DAILY_LIMIT_TIMEZONE || DEFAULT_BUDGET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function budgetPathFor(day) {
  return `${BUDGET_PREFIX}/${day}.json`;
}

async function readBudgetCount(day, token) {
  const { blobs } = await list({ prefix: budgetPathFor(day), limit: 1, token });
  if (!blobs.length) return 0;
  const res = await fetch(`${blobs[0].url}?_=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return 0;
  const data = await res.json().catch(() => null);
  return data && typeof data.count === 'number' ? data.count : 0;
}

async function isDailyBudgetExceeded() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false; // 저장소 미설정 → 상한 비활성(fail-open)
  try {
    const day = getBudgetDayKey();
    return (await readBudgetCount(day, token)) >= getBudgetLimit();
  } catch {
    return false; // fail-open
  }
}

async function incrementDailyBudget() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  try {
    const day = getBudgetDayKey();
    const current = await readBudgetCount(day, token);
    await put(budgetPathFor(day), JSON.stringify({ day, count: current + 1 }), {
      access: 'public',
      contentType: 'application/json',
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } catch {
    // fail-open
  }
}
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';
const imageQuality = process.env.OPENAI_IMAGE_QUALITY || 'high';
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
  const prompt = [
    'This editor must work only from the fixed template base image already provided by the system.',
    'Never generate a new scene. Never reinterpret the template scene. Never omit any visible template element.',
    'Treat the selected template image as the locked knowledge image and the only allowed base image for the edit.',
    'Do not ask for the original template image to be uploaded again. The system-provided template image is already the editing base.',
    'Absolutely do not change the template composition, camera angle, background, color tone, lighting, steam, texture, water detail, props, costume, accessory, furniture, wood grain, or the cat placement inside the scene.',
    'Only replace the existing cat in the template image with the cat from the uploaded reference photo.',
    'Preserve the uploaded cat face shape, fur color, fur pattern, markings, body shape, eyes, nose color, expression mood, and overall identity as faithfully as possible.',
    'Do not creatively redesign the cat. Do not create a different cat. Do not create a new pose or a new layout.',
    "Output ratio must remain 1024x1536. The final image must be ultra-detailed, sharp, photoreal, and look like a real photo edit, not a newly generated image.",
    "Highest-priority rule: 'Do not touch anything else. Only replace the cat in the original template photo with the cat from the attached photo. Keep the attached cat's facial features, fur color, fur pattern, and body shape exactly as much as possible.'",
  ].join(' ');
  const additionalPrompt = (basePrompt || '').trim();
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
    additionalPrompt ? `Additional note with lower priority than the fixed rules: ${additionalPrompt}` : '',
    'Use the first image as the fixed template base image.',
    'Use the second image as the cat identity reference.',
    'This is an identity transfer, not a new scene generation.',
    templateReferenceParts.length
      ? `Template concept reference: ${templateReferenceParts.join(' | ')}`
      : '',
    'Use the template concept reference only to understand the role, styling, mood, and scenario already visible in the template image. Do not invent new scene elements that are not already present in the template.',
    'Follow this process exactly:',
    '1. Lock the template image and preserve every visible template-provided element with zero omissions.',
    '2. Identify the exact cat role, pose, wardrobe, props, and scene relationship already present in the template and keep all of them unchanged.',
    '3. Transfer only the uploaded cat identity traits into that same existing template cat.',
    '4. Return the same template shot with the same concept, but with the user cat replacing only the existing cat identity.',
    'Treat the template cat as the pose, action, composition, styling, and concept source.',
    'Treat the reference cat only as the identity source.',
    'Within the masked region, change only the cat identity traits: face shape, ear shape, eyes, muzzle, nose, breed impression, coat colors, fur texture, and markings.',
    'The output cat must keep the exact same pose, body placement, silhouette, viewing direction, limb positioning, tail direction, facial orientation, and relationship to every template-provided element from the template image.',
    'Any accessory, costume, hat, hood, scarf, clothing, prop, furniture, water detail, steam detail, background detail, or scene element that already exists in the template must remain in the same place and look the same in the result.',
    'If any visible template element is missing, altered, re-staged, simplified, or regenerated differently, the result is incorrect.',
    'The result should feel like the same original template photo, with only the original template cat swapped into the uploaded cat identity.',
    'Keep the template background, styling, accessories, clothing, props, framing, camera angle, lighting, and every unmasked region unchanged.',
    'Always make it look like a high-end real photo edit. Never let it look like a newly generated image.',
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

  if (await isDailyBudgetExceeded()) {
    return res.status(429).json({
      error: '오늘 준비된 무료 체험 인원이 모두 찼어요. 내일 다시 만나요! 🐾',
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const mimeType = file.mimetype || 'image/jpeg';
    const ext = getExtensionFromMimeType(mimeType);
    const imageFile = await toFile(file.buffer, `reference.${ext}`, { type: mimeType });

    const isMaskedFaceSwap = Boolean(templateUrl && maskDataUrl);
    const isUnmaskedFaceSwap = Boolean(templateUrl && !maskDataUrl);

    const editParams = {
      model: imageModel,
      prompt: buildFaceSwapPrompt(prompt, req.body),
      n: 1,
      quality: imageQuality,
      output_format: outputFormat,
      ...(outputCompression !== undefined ? { output_compression: outputCompression } : {}),
    };

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
            ...editParams,
            image: [templateImageFile, imageFile],
            mask: maskFile,
            size: size || 'auto',
          });
        })()
      : isUnmaskedFaceSwap
      ? await (async () => {
          // 마스크 없이 template + 사용자 고양이 두 장을 함께 전달
          const remoteTemplate = await fetchRemoteFile(templateUrl);
          const templateImageFile = await toFile(
            remoteTemplate.buffer,
            `template.${getExtensionFromMimeType(remoteTemplate.mimeType)}`,
            { type: remoteTemplate.mimeType },
          );
          return openai.images.edit({
            ...editParams,
            image: [templateImageFile, imageFile],
            size: size || '1024x1024',
          });
        })()
      : await openai.images.edit({
          ...editParams,
          image: imageFile,
          size: size || '1024x1024',
        });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('No edited image was returned from OpenAI.');

    await incrementDailyBudget();

    return res.json({ resultUrl: `data:${getOutputMimeType()};base64,${b64}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[generate]', message);
    return res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Render API server listening on port ${PORT}`));
