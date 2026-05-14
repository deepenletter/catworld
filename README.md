# catworld

`catworld` is a Next.js app for cat travel-style image generation.

The main production flow is:

1. Admin uploads a template image.
2. Admin marks the cat identity region on that template.
3. Visitors upload their cat photo.
4. The app edits the template so the template pose stays fixed while the visitor cat's face, coat color, and markings transfer onto the cat in the template.

The preferred production flow now uses OpenAI image editing with a template identity mask.

## Required environment variables

```env
ADMIN_PASSWORD=your-secret-password
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxx
OPENAI_API_KEY=sk-xxxx
OPENAI_IMAGE_MODEL=gpt-image-2
NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY=
NEXT_PUBLIC_GENERATE_API_URL=
```

Notes:

- `ADMIN_PASSWORD` is required for `/admin`.
- `BLOB_READ_WRITE_TOKEN` is required for template upload and config save.
- `OPENAI_API_KEY` is required for the masked AI identity-transfer flow.
- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` is optional and enables a direct KakaoTalk share button.
- `NEXT_PUBLIC_GENERATE_API_URL` is optional and only used when a separate image API is deployed.

## Deploying on Vercel

Deploy the root project as a normal Next.js app and set:

- `ADMIN_PASSWORD`
- `BLOB_READ_WRITE_TOKEN`
- `OPENAI_API_KEY`
- `OPENAI_IMAGE_MODEL=gpt-image-2`
- `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` only if you want direct KakaoTalk sharing

## Deploying on Render

Deploy the root app as a Node web service.

- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

You can also deploy directly from the included `render.yaml`.

## Optional separate AI API

If you want AI image editing on a separate Render service:

1. Deploy `render-api/` as another Node web service.
2. Set `OPENAI_API_KEY` and `OPENAI_IMAGE_MODEL=gpt-image-2` there.
3. Set `NEXT_PUBLIC_GENERATE_API_URL` on the main app to that public URL.

## Admin mode

Each template can use one of these modes:

- `AI 편집`: recommended for your current product goal. It keeps the template pose while matching the visitor cat's face, fur colors, and markings.
- `얼굴 합성`: fallback mode if you want a fast local composite instead of model-based editing.

## Share popup

The result page now opens an in-app share popup.

- On mobile browsers with Web Share support, users can open the native share sheet and share to installed targets such as KakaoTalk and other SNS apps.
- On unsupported browsers, the popup falls back to copy-link and social share buttons.
- If `NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY` is configured and the domain is registered in Kakao Developers, the popup also shows a direct KakaoTalk share button.
