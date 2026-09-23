# Shivam Panda: personal website

A small personal site styled after Nothing hardware: dot-matrix type, a monochrome palette with one red accent, and a working 25×25 **Glyph Matrix**. The matrix runs a double pendulum, a precessing orbit, live U(1) lattice Metropolis updates, an Oxford clock, and Snake.

Built with Vite + TypeScript + React-style components, running on Preact (about 22 KB of gzipped JavaScript).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Edit content

Everything except blog posts (bio, experience, projects, education, links) lives in [`src/data.ts`](src/data.ts).
To add a résumé button, put a PDF in `public/` and set `profile.resume` to its filename.

## Blog

Posts are Markdown files in [`posts/`](posts/) with a short frontmatter header (title, date, summary, tags, draft).
They are listed at `#/blog`, the three newest also appear on the home page, and drafts are hidden in production.

Posts support LaTeX math via KaTeX, which only loads on posts that use it: inline `$E = mc^2$` or `\(E = mc^2\)`, display `$$ … $$` or `\[ … \]` on their own lines. A price like `$5` is left alone; write `\$` for a literal dollar sign if needed.

To add a post, create `posts/my-post.md`, preview it with `npm run dev`, and push. Post images go in `public/blog/`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site will be at `https://sopanda0910.github.io/Personal_Website/`.

## Shortcuts

- `1`–`6` jump between sections
- ◀ ▶ switch glyph toys; on Snake use arrows / WASD / swipe
- `SND` toggles UI click sounds; the switch toggles light/dark
