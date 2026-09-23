// Markdown → HTML. `marked` is loaded on demand so it never weighs down the home page,
// and KaTeX (plus its CSS and fonts) only loads for posts that actually contain math.
// Posts come only from this repo (committed by the site owner), so raw HTML in posts is trusted.
//
// Math syntax:  inline $E = mc^2$ or \(E = mc^2\)   display $$ ... $$ or \[ ... \]
// A lone "$5" is left alone: inline $…$ must not start/end with a space or be followed by a digit.

import type { MarkedExtension, Tokens } from 'marked'

type Renderer = (src: string) => string

let plain: Promise<Renderer> | null = null
let withMath: Promise<Renderer> | null = null

const HAS_MATH = /\$|\\\(|\\\[/

function loadPlain() {
  plain ??= import('marked').then(({ Marked }) => {
    const md = new Marked({ gfm: true, async: false })
    return (src: string) => md.parse(src) as string
  })
  return plain
}

function loadMath() {
  withMath ??= Promise.all([import('marked'), import('katex'), import('katex/dist/katex.min.css')]).then(
    ([{ Marked }, { default: katex }]) => {
      const tex = (text: string, displayMode: boolean) =>
        katex.renderToString(text, { displayMode, throwOnError: false, output: 'htmlAndMathml' })

      type MathToken = Tokens.Generic & { text: string; display: boolean }
      const block = (name: string, re: RegExp, open: string) => ({
        name,
        level: 'block' as const,
        start: (src: string) => src.indexOf(open) >= 0 ? src.indexOf(open) : undefined,
        tokenizer(src: string) {
          const m = re.exec(src)
          if (m) return { type: name, raw: m[0], text: m[1].trim(), display: true } as MathToken
        },
        renderer: (t: Tokens.Generic) => `<div class="math-display">${tex((t as MathToken).text, true)}</div>\n`,
      })
      const inline = (name: string, re: RegExp, open: string, display: boolean) => ({
        name,
        level: 'inline' as const,
        start: (src: string) => src.indexOf(open) >= 0 ? src.indexOf(open) : undefined,
        tokenizer(src: string) {
          const m = re.exec(src)
          if (m) return { type: name, raw: m[0], text: m[1].trim(), display } as MathToken
        },
        renderer: (t: Tokens.Generic) => tex((t as MathToken).text, (t as MathToken).display),
      })

      const ext: MarkedExtension = {
        extensions: [
          block('mathBlockDollar', /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/, '$$'),
          block('mathBlockBracket', /^\\\[([\s\S]+?)\\\][ \t]*(?:\n|$)/, '\\['),
          inline('mathInlineDisplay', /^\$\$([\s\S]+?)\$\$/, '$$', true),
          inline('mathInlineDollar', /^\$(?!\s)((?:\\.|[^\\$\n])+?)(?<!\s)\$(?!\d)/, '$', false),
          inline('mathInlineParen', /^\\\(([\s\S]+?)\\\)/, '\\(', false),
        ],
      }
      const md = new Marked({ gfm: true, async: false }, ext)
      return (src: string) => md.parse(src) as string
    },
  )
  return withMath
}

export async function render(src: string, rewriteImg?: (src: string) => string) {
  const toHtml = await (HAS_MATH.test(src) ? loadMath() : loadPlain())
  const doc = new DOMParser().parseFromString(toHtml(src), 'text/html')
  doc.querySelectorAll('a[href^="http"]').forEach((a) => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noreferrer')
  })
  doc.querySelectorAll('img').forEach((img) => {
    img.setAttribute('loading', 'lazy')
    if (rewriteImg) img.setAttribute('src', rewriteImg(img.getAttribute('src') ?? ''))
  })
  return doc.body.innerHTML
}

export const formatDate = (d: string) => d.replaceAll('-', '.')
