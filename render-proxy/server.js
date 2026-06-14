import cors from 'cors';
import express from 'express';
import 'dotenv/config';
import '@shopify/shopify-api/adapters/node';
import { LATEST_API_VERSION, shopifyApi } from '@shopify/shopify-api';

const app = express();
const port = process.env.PORT || 3000;
const mangaDexBaseUrl = 'https://api.mangadex.org';
const uploadsBaseUrl = 'https://uploads.mangadex.org';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const shopifyScopes = parseScopes(process.env.SHOPIFY_SCOPES);
const shopifyHostName = normalizeHostName(process.env.HOST);
const missingShopifyConfig = getMissingShopifyConfig();

// ─── Shopify ──────────────────────────────────────────────────────────────────
const shopify = missingShopifyConfig.length === 0
  ? shopifyApi({
      apiKey: process.env.SHOPIFY_API_KEY,
      apiSecretKey: process.env.SHOPIFY_API_SECRET,
      scopes: shopifyScopes,
      hostName: shopifyHostName,
      apiVersion: LATEST_API_VERSION,
      isEmbeddedApp: false
    })
  : null;

// Temporary in-memory store: shop → { userId, state }
// Keeps track of WHO initiated OAuth until callback fires
// Safe for single-instance Render deploys; swap for Redis if you scale
const pendingConnections = new Map();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  if (isShopifyRelatedRequest(req)) {
    console.log('[Shopify request]', {
      method: req.method,
      path: req.path,
      host: req.get('host'),
      userAgent: req.get('user-agent'),
      shop: typeof req.query.shop === 'string' ? req.query.shop : undefined,
      query: req.query,
      headers: pickHeaders(req.headers, [
        'host',
        'user-agent',
        'x-forwarded-for',
        'x-forwarded-proto',
        'x-shopify-shop-domain',
        'x-shopify-topic',
        'x-shopify-hmac-sha256',
        'x-shopify-api-version'
      ]),
      body: req.body
    });
  }
  next();
});

app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'HEAD', 'POST', 'OPTIONS']
  })
);

// ─── Basic routes ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'anime-reader-mangadex-proxy' });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// ─── Shopify Auth ─────────────────────────────────────────────────────────────

/**
 * POST /auth/shopify
 * Body: { shop: "merchant-store.myshopify.com", userId: "your-app-user-id" }
 *
 * Called from your frontend AFTER the user logs into YOUR app.
 * userId identifies which of your users is connecting this shop.
 * Redirects the browser to Shopify's OAuth consent screen.
 */
app.post('/auth/shopify', async (req, res) => {
  if (!shopify) {
    res.status(500).json(buildShopifyConfigError());
    return;
  }

  const shop = typeof req.body.shop === 'string' ? req.body.shop.trim() : '';
  const userId = typeof req.body.userId === 'string' ? req.body.userId.trim() : '';

  if (!shop) {
    res.status(400).json({ error: 'Missing required "shop" field. Example: my-store.myshopify.com' });
    return;
  }

  if (!shop.endsWith('.myshopify.com')) {
    res.status(400).json({ error: 'Shop must end with .myshopify.com' });
    return;
  }

  if (!userId) {
    res.status(400).json({ error: 'Missing required "userId" field.' });
    return;
  }

  // Remember who is connecting this shop so the callback can save it correctly
  pendingConnections.set(shop, { userId });

  console.log('[Shopify auth] begin', { shop, userId });

  try {
    await shopify.auth.begin({
      shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res
    });
  } catch (error) {
    console.error('[Shopify auth] begin error:', error);
    res.status(500).json({ error: 'Failed to begin Shopify auth flow.' });
  }
});

/**
 * GET /auth/callback
 * Shopify redirects here after the merchant clicks "Allow".
 * Saves the access token + shop to Postgres linked to the userId.
 */
app.get('/auth/callback', async (req, res) => {
  if (!shopify) {
    res.status(500).json(buildShopifyConfigError());
    return;
  }

  try {
    console.log('[Shopify auth] callback hit', {
      host: req.get('host'),
      query: req.query
    });

    const { session } = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res
    });

    console.log('ACCESS TOKEN:', session.accessToken);
    console.log('SHOP:', session.shop);
    console.log('[Shopify auth] session details', {
      shop: session.shop,
      scope: session.scope,
      state: session.state,
      isOnline: session.isOnline,
      expires: session.expires
    });

    res.send(`Token received for ${session.shop}! Migration tool ready.`);
  } catch (error) {
    console.error('[Shopify auth] callback error:', error);
    res.status(500).json({ error: 'Failed to complete Shopify auth callback.' });
  }
});

/**
 * GET /shops?userId=xxx
 * Returns all Shopify shops connected by a given user.
 * In production replace userId query param with a verified JWT.
 */
app.get('/shops', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';

  if (!userId) {
    res.status(400).json({ error: 'Missing required "userId" query parameter.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, shop, scope, connected_at FROM shops WHERE user_id = $1 ORDER BY connected_at DESC`,
      [userId]
    );

    res.json({ shops: result.rows });
  } catch (error) {
    console.error('[shops] DB error:', error);
    res.status(500).json({ error: 'Failed to fetch shops.' });
  }
});

/**
 * Legacy GET /auth — kept for backwards compatibility.
 * Use POST /auth/shopify for new flows.
 */
app.get('/auth', async (req, res) => {
  if (!shopify) {
    res.status(500).json(buildShopifyConfigError());
    return;
  }

  const shop = typeof req.query.shop === 'string' ? req.query.shop : '';
  const userId = typeof req.query.userId === 'string' ? req.query.userId : 'legacy';

  console.log('[Shopify auth] /auth hit (legacy)', { shop: shop || '(missing)' });

  if (!shop) {
    res.status(400).json({ error: 'Missing required "shop" query parameter.' });
    return;
  }

  pendingConnections.set(shop, { userId });

  try {
    await shopify.auth.begin({
      shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res
    });
  } catch (error) {
    console.error('[Shopify auth] begin error:', error);
    res.status(500).json({ error: 'Failed to begin Shopify auth flow.' });
  }
});

// ─── MangaDex proxy routes ────────────────────────────────────────────────────
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

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`MangaDex proxy listening on port ${port}`);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function pipeUpstreamResponse({ requestUrl, response, fallbackContentType }) {
  const upstreamResponse = await fetch(requestUrl, {
    method: 'GET',
    headers: { Accept: '*/*' }
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
  if (value === undefined || value === null) return;

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

  if (!prefix) return;
  searchParams.append(prefix, String(value));
}

function isAllowedImageHost(hostname) {
  return hostname === 'uploads.mangadex.org' || hostname.endsWith('.mangadex.network');
}

function parseScopes(rawScopes) {
  return (rawScopes || 'write_products,write_metaobjects,write_metaobject_definitions')
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function normalizeHostName(rawHost) {
  if (!rawHost) return '';
  return rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function getMissingShopifyConfig() {
  const missing = [];
  if (!process.env.SHOPIFY_API_KEY) missing.push('SHOPIFY_API_KEY');
  if (!process.env.SHOPIFY_API_SECRET) missing.push('SHOPIFY_API_SECRET');
  if (!normalizeHostName(process.env.HOST)) missing.push('HOST');
  return missing;
}

function isShopifyRelatedRequest(req) {
  const path = req.path || '';
  const userAgent = req.get('user-agent') || '';
  return (
    path.startsWith('/auth') ||
    path.startsWith('/shops') ||
    Boolean(req.get('x-shopify-shop-domain')) ||
    Boolean(req.get('x-shopify-topic')) ||
    userAgent.toLowerCase().includes('shopify')
  );
}

function pickHeaders(headers, keys) {
  return Object.fromEntries(
    keys
      .map((key) => [key, headers[key]])
      .filter(([, value]) => value !== undefined)
  );
}

function buildShopifyConfigError() {
  return {
    error: 'Shopify auth is not configured for this server.',
    missing: missingShopifyConfig,
    expected: {
      SHOPIFY_API_KEY: 'Shopify app Client ID',
      SHOPIFY_API_SECRET: 'Shopify app secret',
      HOST: 'Render hostname only, e.g. anime-reader.onrender.com'
    },
    nextStep: 'Add the missing values in Render environment variables and redeploy.'
  };
}