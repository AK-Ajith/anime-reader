# maga-reader

Frontend-only Angular manga reader MVP with a dark Netflix-inspired UI, mock authentication, bookmarks, continue reading, and localStorage persistence.

## Scripts

- `npm start` runs the local dev server
- `npm run build` builds the app for production
- `npm run build:pages` builds the app for GitHub Pages with the `/maga-reader/` base href

## GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`.

To publish on GitHub Pages:

1. Push the repository to GitHub on the `main` branch.
2. In GitHub, open `Settings -> Pages`.
3. Set `Source` to `GitHub Actions`.
4. Push again or manually run the workflow.

The site will publish at:

`https://<your-github-username>.github.io/maga-reader/`
