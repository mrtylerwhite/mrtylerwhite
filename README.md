# mrtylerwhite.com

Static portfolio site for [Mr. Tyler White](https://mrtylerwhite.com), Senior Product Designer based in Montreal.

## Deploy

This is a pre-built static site — no build step. Deploy as-is.

### Vercel (recommended)

1. Connect this repo to a new Vercel project
2. **Framework Preset:** Other (Vercel auto-detects this is static — no overrides needed)
3. **Output Directory:** `.` (root)
4. Deploy

`vercel.json` already configures:
- Clean URLs with trailing slashes (`/about/`)
- Long cache (1 year, immutable) for images, fonts, videos
- Short cache (must-revalidate) for HTML
- Permanent redirects for legacy URLs (`/sample-page`, `/home-2`, `/casestudies/eye-care-provider`)
- Security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)

### Local preview

```bash
npx serve@latest . -l 4321
# open http://localhost:4321/
```

## Structure

```
.
├── index.html                            home
├── about/index.html
├── case-studies/index.html
├── resume/index.html
├── privacy-policy/index.html
├── 404.html
├── casestudies/                          7 case study detail pages
│   ├── notch-financial/
│   ├── the-innovation-of-verify/
│   ├── keplers-prebuilt-workflows/
│   ├── kepler-pipeline-builder/
│   ├── guroo-chat-app/
│   ├── eyecare-provider/
│   ├── eyecare-provider2/
│   └── essentia-matresses/
├── wp-content/                           media + theme assets
│   ├── uploads/                          images + 3 videos (~104 MB)
│   └── themes/Divi/                      WP theme CSS/JS/icon font
├── wp-includes/                          WP core JS/CSS deps
├── s/                                    Google Fonts cached locally (Figtree, Geist, Smooch)
├── favicon.ico
├── robots.txt
├── sitemap.xml + page-sitemap.xml
└── vercel.json
```

**Total:** 13 HTML pages · 197 images · 3 videos · 110 MB on disk · 279 files.

## What loads from the internet at runtime

These are SaaS dependencies (same as on production):

| URL | Purpose |
|---|---|
| `widget.senja.io/widget/.../platform.js` | Testimonials carousel on homepage |
| `www.googletagmanager.com/gtag/js?id=GT-NBP3W94` | Google Analytics |
| `fonts.googleapis.com` | Google Fonts CSS (font files cached locally as fallback) |
| `www.figma.com/embed?...` | Figma prototype iframe inside the Notch case study |

Everything else — including all images, videos, page CSS, JS, and icon fonts — is served locally.
