import { useCallback, useEffect, useRef, useState } from 'react'
import { posts as deployed } from 'virtual:posts'
import { parse, serialize, slugify, SLUG_RE, type Meta } from '../blog/frontmatter'
import { actionsUrl, bytesToB64, deleteFile, GhError, listDir, rawUrl, readText, textToB64, verify, writeFile } from '../blog/github'
import { formatDate, render } from '../blog/markdown'
import { site } from '../data'
import { blip } from '../sound'

// Post editor. Writes go through the GitHub API with a fine-grained token that GitHub itself
// checks, so this page grants nothing without one.

const TOKEN_KEY = 'sp-admin-token'
const POSTS_DIR = 'posts'
const IMG_DIR = 'public/blog'

type Session = { token: string; login: string }
type Remote = { slug: string; sha: string; meta: Meta }
type Draft = { origSlug: string | null; sha: string | null; slug: string; slugTouched: boolean; meta: Meta; body: string }
type Status = { kind: 'ok' | 'err' | 'busy'; text: string; link?: boolean } | null

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const blank = (): Draft => ({
  origSlug: null,
  sha: null,
  slug: '',
  slugTouched: false,
  meta: { title: '', date: today(), summary: '', tags: [], draft: false },
  body: '',
})

const storage = {
  load(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  save(token: string, remember: boolean) {
    try {
      ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

const errText = (e: unknown) =>
  e instanceof GhError
    ? e.status === 401
      ? 'GitHub rejected the token (expired or revoked).'
      : e.status === 409
        ? 'This file changed on GitHub since you opened it. Reload the list and try again.'
        : `GitHub: ${e.message}`
    : e instanceof Error
      ? e.message
      : String(e)

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(() => storage.load() !== null)

  useEffect(() => {
    document.title = 'sudo · Shivam Panda'
    const token = storage.load()
    if (token)
      verify(token)
        .then((login) => setSession({ token, login }))
        .catch(() => storage.clear())
        .finally(() => setChecking(false))
    return () => void (document.title = 'Shivam Panda')
  }, [])

  const lock = useCallback(() => {
    storage.clear()
    setSession(null)
    blip(440, 0.08)
  }, [])

  return (
    <section className="section page admin">
      <a className="mono back" href="#top">← Exit to site</a>
      <div className="admin-head">
        <h1 className="dot">sudo</h1>
        <div className="mono admin-who">
          <span className={`rec${session ? '' : ' idle'}`} />
          {session ? (
            <>
              Superuser · {session.login}
              <button className="linkish" onClick={lock}>Lock</button>
            </>
          ) : (
            'Locked'
          )}
        </div>
      </div>
      {checking ? <p className="mono dim">Checking credentials…</p> : session ? <Console session={session} onExpired={lock} /> : <Login onUnlock={setSession} />}
    </section>
  )
}

function Login({ onUnlock }: { onUnlock: (s: Session) => void }) {
  const [token, setToken] = useState('')
  const [remember, setRemember] = useState(false)
  const [status, setStatus] = useState<Status>(null)
  const { owner, name } = site.repo
  const tokenUrl =
    'https://github.com/settings/personal-access-tokens/new?' +
    new URLSearchParams({
      name: 'Website blog admin',
      description: `Blog editing for ${owner}.github.io/${name}.`,
      target_name: owner,
      expires_in: '366',
      contents: 'write',
    })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = token.trim()
    if (!t) return
    setStatus({ kind: 'busy', text: 'Verifying with GitHub…' })
    try {
      const login = await verify(t)
      storage.save(t, remember)
      blip(1320, 0.08, 'sine', 0.05)
      onUnlock({ token: t, login })
    } catch (err) {
      setStatus({ kind: 'err', text: errText(err) })
      blip(220, 0.12)
    }
  }

  return (
    <div className="admin-login">
      <form className="panel login-card" onSubmit={submit}>
        <label className="mono" htmlFor="tok">GitHub access token</label>
        <input
          id="tok"
          className="field"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="github_pat_…"
          value={token}
          onChange={(e) => setToken(e.currentTarget.value)}
        />
        <label className="check mono">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.currentTarget.checked)} />
          Remember on this device
        </label>
        <button className="btn primary" type="submit" disabled={status?.kind === 'busy'}>
          <span className="mono">Unlock</span>
        </button>
        <StatusLine status={status} />
      </form>
      <ol className="login-steps">
        <li>
          Open the pre-filled GitHub token form (sign in to GitHub if asked). The name, 1-year expiry and{' '}
          <b>Contents: Read and write</b> permission are already filled in.
          <br />
          <a className="btn token-btn" href={tokenUrl} target="_blank" rel="noreferrer">
            <span className="mono">Create token on GitHub ↗</span>
          </a>
        </li>
        <li>
          Under <b>Repository access</b>, choose <b>Only select repositories</b> and pick <code>{name}</code>.
        </li>
        <li>
          Scroll down and click <b>Generate token</b>, then copy it (it starts with <code>github_pat_</code>; GitHub shows it only once).
        </li>
        <li>Paste it here and tick “Remember” on your own computer. It is only ever sent to api.github.com.</li>
        <li className="dim">Lost it or it expired? Make a new one the same way. Leaked? Delete it on that same GitHub settings page.</li>
      </ol>
    </div>
  )
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null
  return (
    <p className={`status mono ${status.kind}`} role="status">
      {status.kind === 'busy' && <span className="spinner" />}
      {status.text}
      {status.link && (
        <>
          {' '}
          <a href={actionsUrl} target="_blank" rel="noreferrer">Watch deploy ↗</a>
        </>
      )}
    </p>
  )
}

function Console({ session, onExpired }: { session: Session; onExpired: () => void }) {
  const [remote, setRemote] = useState<Remote[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'busy', text: 'Loading posts from GitHub…' })

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof GhError && e.status === 401) onExpired()
      setStatus({ kind: 'err', text: errText(e) })
      blip(220, 0.12)
    },
    [onExpired],
  )

  const load = useCallback(async () => {
    try {
      const files = (await listDir(session.token, POSTS_DIR)).filter((f) => f.name.endsWith('.md'))
      const list = await Promise.all(
        files.map(async (f) => {
          const { text, sha } = await readText(session.token, f.path)
          return { slug: f.name.slice(0, -3), sha, meta: parse(text).meta }
        }),
      )
      list.sort((a, b) => b.meta.date.localeCompare(a.meta.date))
      setRemote(list)
      setStatus(null)
    } catch (e) {
      fail(e)
    }
  }, [session.token, fail])

  useEffect(() => {
    load()
  }, [load])

  // warn before losing unsaved edits
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const open = async (r: Remote) => {
    setStatus({ kind: 'busy', text: `Opening ${r.slug}…` })
    try {
      const { text, sha } = await readText(session.token, `${POSTS_DIR}/${r.slug}.md`)
      const { meta, body } = parse(text)
      setDraft({ origSlug: r.slug, sha, slug: r.slug, slugTouched: true, meta, body })
      setDirty(false)
      setStatus(null)
    } catch (e) {
      fail(e)
    }
  }

  const close = () => {
    if (dirty && !confirm('Discard unsaved changes?')) return
    setDraft(null)
    setDirty(false)
    setStatus(null)
  }

  const remove = async (slug: string, sha: string, title: string) => {
    if (!confirm(`Delete “${title}”?\n\nThis commits a deletion to GitHub and the post disappears from the site after the next deploy.`)) return
    setStatus({ kind: 'busy', text: `Deleting ${slug}…` })
    try {
      await deleteFile(session.token, `${POSTS_DIR}/${slug}.md`, sha, `blog: delete ${slug}`)
      setRemote((r) => r?.filter((p) => p.slug !== slug) ?? null)
      if (draft?.origSlug === slug) {
        setDraft(null)
        setDirty(false)
      }
      setStatus({ kind: 'ok', text: `Deleted ${slug}. Live in about a minute.`, link: true })
      blip(660, 0.08)
    } catch (e) {
      fail(e)
    }
  }

  const save = async (d: Draft) => {
    const slug = d.slug.trim()
    if (!d.meta.title.trim()) return setStatus({ kind: 'err', text: 'Give the post a title.' })
    if (!SLUG_RE.test(slug)) return setStatus({ kind: 'err', text: 'Slug must be lowercase letters, numbers and single dashes.' })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.meta.date)) return setStatus({ kind: 'err', text: 'Date must look like 2026-09-23.' })
    if (slug !== d.origSlug && remote?.some((p) => p.slug === slug))
      return setStatus({ kind: 'err', text: `A post called “${slug}” already exists.` })

    setStatus({ kind: 'busy', text: 'Committing to GitHub…' })
    try {
      const text = serialize(d.meta, d.body)
      const path = `${POSTS_DIR}/${slug}.md`
      const renamed = d.origSlug !== null && d.origSlug !== slug
      const verb = d.origSlug === null ? 'add' : renamed ? `rename ${d.origSlug} →` : 'update'
      const sha = await writeFile(session.token, path, textToB64(text), `blog: ${verb} ${slug}`, renamed ? undefined : (d.sha ?? undefined))
      if (renamed && d.sha) await deleteFile(session.token, `${POSTS_DIR}/${d.origSlug}.md`, d.sha, `blog: rename ${d.origSlug} → ${slug}`)
      setDraft({ ...d, slug, origSlug: slug, sha, slugTouched: true })
      setDirty(false)
      setRemote((r) => {
        const rest = (r ?? []).filter((p) => p.slug !== slug && p.slug !== d.origSlug)
        return [{ slug, sha, meta: d.meta }, ...rest].sort((a, b) => b.meta.date.localeCompare(a.meta.date))
      })
      setStatus({
        kind: 'ok',
        text: d.meta.draft ? 'Saved as draft (hidden on the site).' : 'Committed. The site redeploys in about a minute.',
        link: true,
      })
      blip(1320, 0.08, 'sine', 0.05)
    } catch (e) {
      fail(e)
    }
  }

  if (draft)
    return (
      <Editor
        draft={draft}
        dirty={dirty}
        status={status}
        token={session.token}
        onChange={(d) => {
          setDraft(d)
          setDirty(true)
        }}
        onSave={save}
        onClose={close}
        onDelete={draft.origSlug && draft.sha ? () => remove(draft.origSlug!, draft.sha!, draft.meta.title) : undefined}
        onStatus={setStatus}
      />
    )

  const live = new Set(deployed.map((p) => p.slug))
  return (
    <div className="console">
      <div className="console-bar">
        <button className="btn primary" onClick={() => (setDraft(blank()), setDirty(false), setStatus(null), blip(1100))}>
          <span className="mono">+ New post</span>
        </button>
        <button className="btn" onClick={() => (setStatus({ kind: 'busy', text: 'Loading posts from GitHub…' }), load())}>
          <span className="mono">Reload</span>
        </button>
        <StatusLine status={status} />
      </div>
      {remote && remote.length === 0 && <p className="mono dim">No posts in the repo yet. Write the first one.</p>}
      {remote && remote.length > 0 && (
        <ul className="admin-list">
          {remote.map((p) => (
            <li key={p.slug} className="panel">
              <span className="mono dim">{formatDate(p.meta.date)}</span>
              <span className="admin-title">
                <b>{p.meta.title}</b>
                <span className="mono dim">/{p.slug}</span>
              </span>
              <span className={`tag ${p.meta.draft ? 'draft' : live.has(p.slug) ? 'live' : ''}`}>
                {p.meta.draft ? 'Draft' : live.has(p.slug) ? 'Live' : 'Deploying'}
              </span>
              <span className="admin-actions">
                <button className="btn small-btn" onClick={() => open(p)}>
                  <span className="mono">Edit</span>
                </button>
                <button className="btn small-btn danger" onClick={() => remove(p.slug, p.sha, p.meta.title)}>
                  <span className="mono">Delete</span>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type EditorProps = {
  draft: Draft
  dirty: boolean
  status: Status
  token: string
  onChange: (d: Draft) => void
  onSave: (d: Draft) => void
  onClose: () => void
  onDelete?: () => void
  onStatus: (s: Status) => void
}

function Editor({ draft, dirty, status, token, onChange, onSave, onClose, onDelete, onStatus }: EditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [html, setHtml] = useState('')
  const [tagText, setTagText] = useState(draft.meta.tags.join(', '))
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const { meta } = draft

  const set = (patch: Partial<Meta>) => {
    const next = { ...draft, meta: { ...meta, ...patch } }
    if (patch.title !== undefined && !draft.slugTouched) next.slug = slugify(patch.title)
    onChange(next)
  }

  // live preview; uploaded images aren't deployed yet, so preview them from the repo
  useEffect(() => {
    const t = setTimeout(() => {
      render(draft.body, (src) => (src.startsWith('blog/') ? rawUrl(`public/${src}`) : src)).then(setHtml)
    }, 180)
    return () => clearTimeout(t)
  }, [draft.body])

  // Ctrl/Cmd+S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave(draft)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [draft, onSave])

  const insert = (text: string) => {
    const el = area.current
    const at = el ? el.selectionStart : draft.body.length
    const end = el ? el.selectionEnd : at
    onChange({ ...draft, body: draft.body.slice(0, at) + text + draft.body.slice(end) })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + text.length, at + text.length)
    })
  }

  const upload = async (f: File) => {
    if (f.size > 5 * 1024 * 1024) return onStatus({ kind: 'err', text: 'Images must be under 5 MB.' })
    const dot = f.name.lastIndexOf('.')
    const ext = dot > 0 ? f.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : 'png'
    const base = slugify(dot > 0 ? f.name.slice(0, dot) : f.name) || 'image'
    const name = `${Date.now().toString(36)}-${base}.${ext}`
    onStatus({ kind: 'busy', text: `Uploading ${f.name}…` })
    try {
      const bytes = new Uint8Array(await f.arrayBuffer())
      await writeFile(token, `${IMG_DIR}/${name}`, bytesToB64(bytes), `blog: upload image ${name}`)
      insert(`![${base.replace(/-/g, ' ')}](blog/${name})`)
      onStatus({ kind: 'ok', text: 'Image uploaded. Save the post to publish it.' })
    } catch (e) {
      onStatus({ kind: 'err', text: errText(e) })
    }
  }

  return (
    <div className="editor">
      <div className="console-bar">
        <button className="btn" onClick={onClose}>
          <span className="mono">← Posts</span>
        </button>
        <button className="btn primary" onClick={() => onSave(draft)} disabled={status?.kind === 'busy'}>
          <span className="mono">{draft.origSlug ? 'Save' : 'Publish'}{dirty ? ' •' : ''}</span>
        </button>
        {onDelete && (
          <button className="btn danger" onClick={onDelete}>
            <span className="mono">Delete</span>
          </button>
        )}
        <StatusLine status={status} />
      </div>

      <div className="meta-grid">
        <label className="wide">
          <span className="mono">Title</span>
          <input className="field title-field" value={meta.title} onChange={(e) => set({ title: e.currentTarget.value })} placeholder="Post title" />
        </label>
        <label>
          <span className="mono">Slug (URL)</span>
          <input
            className="field"
            value={draft.slug}
            onChange={(e) => onChange({ ...draft, slug: e.currentTarget.value.toLowerCase(), slugTouched: true })}
            placeholder="my-post"
            spellCheck={false}
          />
        </label>
        <label>
          <span className="mono">Date</span>
          <input className="field" type="date" value={meta.date} onChange={(e) => set({ date: e.currentTarget.value })} />
        </label>
        <label className="wide">
          <span className="mono">Summary</span>
          <input className="field" value={meta.summary} onChange={(e) => set({ summary: e.currentTarget.value })} placeholder="One line for the post list" />
        </label>
        <label>
          <span className="mono">Tags (comma separated)</span>
          <input
            className="field"
            value={tagText}
            onChange={(e) => {
              setTagText(e.currentTarget.value)
              set({ tags: e.currentTarget.value.split(',').map((t) => t.trim()).filter(Boolean) })
            }}
            placeholder="physics, notes"
          />
        </label>
        <label className="check mono draft-toggle">
          <input type="checkbox" checked={meta.draft} onChange={(e) => set({ draft: e.currentTarget.checked })} />
          Draft (hidden on the site)
        </label>
      </div>

      <div className="editor-tabs mono" role="tablist">
        <button role="tab" aria-selected={tab === 'write'} className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}>Write</button>
        <button role="tab" aria-selected={tab === 'preview'} className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}>Preview</button>
        <span className="spacer" />
        <button onClick={() => file.current?.click()}>+ Image</button>
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (f) upload(f)
          }}
        />
      </div>

      <div className={`editor-panes show-${tab}`}>
        <textarea
          ref={area}
          className="field body-field"
          value={draft.body}
          onChange={(e) => onChange({ ...draft, body: e.currentTarget.value })}
          placeholder={'Write in Markdown.\n\n## Headings, **bold**, `code`, [links](https://…), lists, > quotes, tables…\n\nMath (LaTeX): inline $E = mc^2$, display on its own lines:\n$$\n\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}\n$$'}
          spellCheck
        />
        <div className="prose preview panel" dangerouslySetInnerHTML={{ __html: html || '<p class="dim">Nothing to preview yet.</p>' }} />
      </div>
      <p className="mono dim editor-foot">Markdown · Math: $inline$ and $$display$$ (LaTeX) · Ctrl/⌘+S to save · {formatDate(meta.date)}</p>
    </div>
  )
}
