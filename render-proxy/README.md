# Render Proxy

This folder contains a small Node/Express proxy for MangaDex.

## Deploy on Render

1. Create a new `Web Service` on Render.
2. Connect this repository.
3. Set `Root Directory` to `render-proxy`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variable:
   - `ALLOWED_ORIGIN=https://<your-github-username>.github.io`
   - Or `ALLOWED_ORIGIN=https://<your-github-username>.github.io/anime-reader` if you want to test that exact value first.
   - `SHOPIFY_API_KEY=<your app api key>`
   - `SHOPIFY_API_SECRET=<your app api secret>`
   - `HOST=<your-render-service>.onrender.com`
   - Optional: `SHOPIFY_SCOPES=write_products,write_customers,write_orders`
7. Deploy.

Your proxy URL will look like:

`https://your-render-service.onrender.com/api/mangadex`

## Local run

```bash
cd render-proxy
npm install
npm start
```

Then point the frontend config to:

`http://localhost:3000/api/mangadex`

## Shopify auth routes

After deployment, start the OAuth flow with:

`https://<your-render-service>.onrender.com/auth?shop=<your-shop>.myshopify.com`

Shopify will call back to:

`https://<your-render-service>.onrender.com/auth/callback`
