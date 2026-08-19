# Buralex.Studio — site

Static site for Buralex Studio (Unity editor tools). No build step, no dependencies.

```
index.html        Home: hero, products, principles, studio, contact
whyslow.html      Product page: WhySlow
assets/css/       style.css — Unity dark-skin design system
assets/js/app.js  scroll-spy for the Hierarchy nav
assets/img/       logo + banners (from the Asset Store publisher profile)
```

## Preview locally

```bash
python3 -m http.server 8777
```

Then open http://localhost:8777

## Deploy

Any static host. Drag the folder into Netlify / Cloudflare Pages, or push to a
GitHub repo and enable Pages. Nothing server-side is required.

## Design

The whole site is styled as the Unity Editor: menu bar, toolbar with play controls,
Hierarchy on the left, Inspector on the right, docked panels with tabs in the middle,
and a status bar at the bottom. Brand colours (amber `#efae49`, teal `#45a29b`) come
from the studio logo and sit on Unity's dark-skin greys.

## Content sources

Copy is written from `whyslow_tech_docs/` in the WhySlow repo, the package README,
and the CV. Two things are placeholders and should be confirmed before launch:

- Product status ("beta", "in development", "coming soon") — update once WhySlow is
  submitted / live, and link the real Asset Store URL in `index.html` (contact card
  "Asset Store publisher") and on `whyslow.html#get`.
- Price is deliberately not stated anywhere yet.
