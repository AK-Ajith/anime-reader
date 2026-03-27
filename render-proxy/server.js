import cors from 'cors';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;
const mangaDexBaseUrl = 'https://api.mangadex.org';
const uploadsBaseUrl = 'https://uploads.mangadex.org';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'HEAD', 'OPTIONS']
  })
);

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'anime-reader-mangadex-proxy'
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/mangadex/*', async (req, res) => {
  try {
    const targetPath = req.path.replace('/api/mangadex', '');

    if (!targetPath) {
      res.status(400).json({ error: 'Missing MangaDex path.' });
      return;
    }

    const upstreamUrl = new URL(`${mangaDexBaseUrl}${targetPath}`);
    appendQueryParams(upstreamUrl.searchParams, req.query);

    await pipeUpstreamResponse({
      requestUrl: upstreamUrl,
      response: res,
      fallbackContentType: 'application/json; charset=utf-8'
    });
  } catch (error) {
    console.error('MangaDex proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed.' });
  }
});

app.get('/api/mangadex-cover/:mangaId/:fileName', async (req, res) => {
  try {
    const upstreamUrl = new URL(`${uploadsBaseUrl}/covers/${req.params.mangaId}/${req.params.fileName}`);
    await pipeUpstreamResponse({
      requestUrl: upstreamUrl,
      response: res,
      fallbackContentType: 'image/jpeg'
    });
  } catch (error) {
    console.error('MangaDex cover proxy error:', error);
    res.status(500).json({ error: 'Cover proxy request failed.' });
  }
});

app.get('/api/mangadex-image', async (req, res) => {
  try {
    const sourceUrl = typeof req.query.url === 'string' ? req.query.url : '';

    if (!sourceUrl) {
      res.status(400).json({ error: 'Missing image URL.' });
      return;
    }

    const upstreamUrl = new URL(sourceUrl);

    if (!isAllowedImageHost(upstreamUrl.hostname)) {
      res.status(400).json({ error: 'Image host is not allowed.' });
      return;
    }

    await pipeUpstreamResponse({
      requestUrl: upstreamUrl,
      response: res,
      fallbackContentType: 'image/jpeg'
    });
  } catch (error) {
    console.error('MangaDex image proxy error:', error);
    res.status(500).json({ error: 'Image proxy request failed.' });
  }
});

app.listen(port, () => {
  console.log(`MangaDex proxy listening on port ${port}`);
});

async function pipeUpstreamResponse({ requestUrl, response, fallbackContentType }) {
  const upstreamResponse = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: '*/*'
    }
  });

  const contentType = upstreamResponse.headers.get('content-type') || fallbackContentType;
  const cacheControl = upstreamResponse.headers.get('cache-control') || 'public, max-age=300';
  const bodyBuffer = Buffer.from(await upstreamResponse.arrayBuffer());

  response.status(upstreamResponse.status);
  response.setHeader('Content-Type', contentType);
  response.setHeader('Cache-Control', cacheControl);
  response.send(bodyBuffer);
}

function appendQueryParams(searchParams, value, prefix) {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const arrayKey = prefix?.endsWith('[]') ? prefix : `${prefix ?? ''}[]`;
      appendQueryParams(searchParams, item, arrayKey);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}[${key}]` : key;
      appendQueryParams(searchParams, nestedValue, nextPrefix);
    }
    return;
  }

  if (!prefix) {
    return;
  }

  searchParams.append(prefix, String(value));
}

function isAllowedImageHost(hostname) {
  return hostname === 'uploads.mangadex.org' || hostname.endsWith('.mangadex.network');
}
