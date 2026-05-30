# Cordia Web Blank

Static browser-only web app template for fast downstream customization.

## Structure

- `public/index.html` - app markup and deploy entry point
- `public/global.css` - global styling
- `public/app.js` - browser-only application logic
- `public/_redirects` - Cloudflare Pages SPA fallback
- `public/_headers` - basic static security headers

## Run locally

Serve the `public` folder with any static file server:

```sh
python3 -m http.server 4173 --directory public
```

Then open `http://localhost:4173`.

## Deploy on Cloudflare Pages

Use these project settings:

- Build command: leave blank
- Build output directory: `public`

This template does not require Node, bundling, server functions, or a build step.
