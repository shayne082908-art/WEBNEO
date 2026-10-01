# NEO Web

A tablet-first browser writing workspace inspired by Hugh Howey's open-source NEO editor.

This repository is an independent browser adaptation/extension project. NEO is MIT-licensed; the original copyright and MIT license are preserved under `licenses/NEO-MIT.txt`.

## Build 02

Build 02 proves the daily writing experience rather than adding AI early. It includes:

- bookshelf + books/chapters
- autosave and offline PWA behavior
- NEO-style Enter ×2 scene breaks / Enter ×3 chapters
- poetry paragraphs
- smart punctuation
- placeholders
- exact-anchor Darlings
- Notes and Outline
- goals and word sprints
- focus mode and typewriter scrolling
- tablet-friendly controls

## Run locally

Because it uses ES modules and a service worker, serve the folder over HTTP:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Static hosting

There is no build step. The repository root is deployable as a static site on Vercel, GitHub Pages, Netlify, Cloudflare Pages, or any ordinary static host.
