# anime-reader

Angular manga reader with MangaDex search/details, saved titles, and local reading progress.

## Scripts

- `npm start` runs the local dev server
- `npm run build` builds the app for production
- `npm run build:pages` builds the app for GitHub Pages with the `/anime-reader/` base href

## Frontend runtime config

The frontend reads its API base URL from:

- [`public/app-config.js`](public/app-config.js)

Examples:

```js
window.__APP_CONFIG__ = {
  mangaDexApiBaseUrl: 'http://localhost:3000/api/mangadex'
};
```

```js
window.__APP_CONFIG__ = {
  mangaDexApiBaseUrl: 'https://your-render-service.onrender.com/api/mangadex'
};
```

## Render Node proxy

This repo now includes a separate Node proxy app inside:

- [`render-proxy/package.json`](render-proxy/package.json)
- [`render-proxy/server.js`](render-proxy/server.js)
- [`render-proxy/render.yaml`](render-proxy/render.yaml)
- [`render-proxy/README.md`](render-proxy/README.md)

Deploy that folder to Render as its own Node web service.

### Render setup

1. Create a new `Web Service` on Render.
2. Connect this repository.
3. Set `Root Directory` to `render-proxy`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variable:
   - `ALLOWED_ORIGIN=https://<your-github-username>.github.io`
7. Deploy the service.
8. Copy the deployed URL and update [`public/app-config.js`](public/app-config.js):

```js
window.__APP_CONFIG__ = {
  mangaDexApiBaseUrl: 'https://your-render-service.onrender.com/api/mangadex'
};
```

## GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`.

To publish the frontend on GitHub Pages:

1. Push the repository to GitHub on the `main` branch.
2. In GitHub, open `Settings -> Pages`.
3. Set `Source` to `GitHub Actions`.
4. Make sure [`public/app-config.js`](public/app-config.js) points at your Render proxy URL.
5. Push again or manually run the workflow.

The site will publish at:

`https://<your-github-username>.github.io/anime-reader/`
