# Durable Knowledge

This document stores durable knowledge from agent sessions so that technical decisions, workarounds, and environment facts survive outside any one agent's memory.

## Deployment

### GitHub Pages & Vite
- **The Issue:** Vite builds output an `assets` directory which can sometimes be named `_assets`. GitHub Pages uses Jekyll by default, and Jekyll ignores any directories or files that start with an underscore (`_`), causing the main JavaScript and CSS files to return a 404 error (resulting in a blank white page).
- **The Fix:** Create an empty `public/.nojekyll` file in the Vite project. This disables Jekyll processing on GitHub Pages entirely and ensures that all Vite assets are served correctly.
- **Reference:** Fixed in `/pizza_party_metrics/issues.md` on 2026-07-21.

### Favicon Caching
- **The Issue:** Browsers can aggressively cache default favicons (like `vite.svg`) or aggressively request `/favicon.ico`. Simply replacing the `favicon.svg` file might not reflect in the browser.
- **The Fix:** Add a cache-busting query parameter to the `href` in the `<link>` tag (e.g., `href="/favicon.svg?v=2"`). Furthermore, providing a `.ico` fallback with `<link rel="alternate icon" href="/favicon.ico">` ensures robust support across all browser types. Use `magick -background none public/favicon.svg -define icon:auto-resize=64,48,32,16 public/favicon.ico` to generate it.
- **Reference:** Fixed in `/pizza_party_metrics/issues.md` on 2026-07-21.
