import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { parse, readingMinutes, SLUG_RE } from '../src/blog/frontmatter.ts'

// Exposes `virtual:posts`: post metadata (small, bundled) plus lazy loaders for each post body.
// Drafts are listed in dev but left out of production builds.

const ID = 'virtual:posts'
const RESOLVED = '\0' + ID

export default function posts(dir = 'posts'): Plugin {
  let root = process.cwd()
  let build = false
  return {
    name: 'posts',
    configResolved(c) {
      root = c.root
      build = c.command === 'build'
    },
    resolveId: (id) => (id === ID ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return
      const abs = resolve(root, dir)
      let files: string[] = []
      try {
        files = readdirSync(abs).filter((f) => f.endsWith('.md'))
      } catch {
        /* no posts yet */
      }
      const list = files
        .map((f) => {
          const slug = f.slice(0, -3)
          const src = readFileSync(join(abs, f), 'utf8')
          this.addWatchFile(join(abs, f))
          const { meta, body } = parse(src)
          return { slug, ...meta, minutes: readingMinutes(body) }
        })
        .filter((p) => SLUG_RE.test(p.slug) && !(build && p.draft))
        .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
      const loaders = list.map((p) => `  ${JSON.stringify(p.slug)}: () => import('/${dir}/${p.slug}.md?raw').then((m) => m.default),`)
      return `export const posts = ${JSON.stringify(list)}\nexport const loaders = {\n${loaders.join('\n')}\n}\n`
    },
    configureServer(server) {
      const abs = resolve(root, dir)
      server.watcher.add(abs)
      const refresh = (file: string) => {
        if (!resolve(file).startsWith(abs)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
      server.watcher.on('change', refresh)
    },
  }
}
