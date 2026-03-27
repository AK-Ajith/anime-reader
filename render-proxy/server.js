import cors from 'cors';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;
const mangaDexBaseUrl = 'https://api.mangadex.org';
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

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    const contentType = upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8';
    const body = await upstreamResponse.text();

    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(body);
  } catch (error) {
    console.error('MangaDex proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed.' });
  }
});

app.listen(port, () => {
  console.log(`MangaDex proxy listening on port ${port}`);
});

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
