# Hem Prasad — Portfolio (Static Site)

This is a modern, responsive portfolio site built with plain HTML/CSS/JS (no Node/npm required).

## How to run (local)

### Option A: open directly
- Open `index.html` in your browser.

### Option B: run a tiny local server (recommended)

#### If you have Python installed

```bash
python -m http.server 5173
```

Then open `http://localhost:5173`.

#### If you don’t have Python (Windows PowerShell)
From this folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 5173
```

Then open `http://localhost:5173`.

## Add your resume PDF (enables “Download Resume”)

1. Copy your resume PDF into:
   - `assets/resume.pdf`
2. Make sure the filename is exactly `resume.pdf` (lowercase).

## Customize content

- Edit `index.html` to update text/sections/links.
- Edit `styles.css` to change theme/colors/layout.

## Deploy (simple)

You can deploy this as a static site on GitHub Pages / Netlify / any static host:
- Upload the folder contents (`index.html`, `styles.css`, `main.js`, and `assets/`) as your site root.

