// Minimal frontmatter for blog posts, shared by the build plugin and the admin editor.
//
// ---
// title: "Post title"
// date: 2026-09-23
// summary: "One line shown in the list"
// tags: ["physics", "notes"]
// draft: false
// ---

export type Meta = {
  title: string
  date: string
  summary: string
  tags: string[]
  draft: boolean
}

const unquote = (s: string) => {
  if (s.startsWith('"') && s.endsWith('"') && s.length > 1) {
    try {
      return JSON.parse(s) as string
    } catch {
      return s.slice(1, -1)
    }
  }
  if (s.startsWith("'") && s.endsWith("'") && s.length > 1) return s.slice(1, -1)
  return s
}

export function parse(src: string): { meta: Meta; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/.exec(src)
  const data: Record<string, string> = {}
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const i = line.indexOf(':')
      if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  }
  const tags = (data.tags ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((t) => unquote(t.trim()))
    .filter(Boolean)
  return {
    meta: {
      title: unquote(data.title ?? '') || 'Untitled',
      date: unquote(data.date ?? ''),
      summary: unquote(data.summary ?? ''),
      tags,
      draft: data.draft === 'true',
    },
    body: m ? src.slice(m[0].length) : src,
  }
}

export function serialize(meta: Meta, body: string) {
  const q = (s: string) => JSON.stringify(s.replace(/\s+/g, ' ').trim())
  return [
    '---',
    `title: ${q(meta.title)}`,
    `date: ${meta.date}`,
    `summary: ${q(meta.summary)}`,
    `tags: [${meta.tags.map((t) => q(t.replace(/,/g, ''))).join(', ')}]`,
    `draft: ${meta.draft}`,
    '---',
    '',
    body.trim(),
    '',
  ].join('\n')
}

export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220))

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
