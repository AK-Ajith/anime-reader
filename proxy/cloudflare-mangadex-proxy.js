export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: createCorsHeaders()
      });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    const url = new URL(request.url);
    const targetPath = url.pathname.replace(/^\/api\/mangadex/, '');

    if (!targetPath) {
      return jsonResponse({ error: 'Missing MangaDex path.' }, 400);
    }

    const upstreamUrl = new URL(`https://api.mangadex.org${targetPath}`);
    upstreamUrl.search = url.search;

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        Accept: 'application/json'
      }
    });

    const headers = new Headers(upstreamResponse.headers);
    applyCorsHeaders(headers);
    headers.set('Cache-Control', 'public, max-age=300');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers
    });
  }
};

function jsonResponse(payload, status) {
  const headers = createCorsHeaders();
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(payload), {
    status,
    headers
  });
}

function createCorsHeaders() {
  const headers = new Headers();
  applyCorsHeaders(headers);
  return headers;
}

function applyCorsHeaders(headers) {
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
}
