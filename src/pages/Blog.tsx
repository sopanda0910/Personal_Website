import { useEffect, useState } from 'react'
import { loaders, posts, type PostMeta } from 'virtual:posts'
import { parse } from '../blog/frontmatter'
import { formatDate, render } from '../blog/markdown'
import { SectionHead } from '../components/Sections'
import { postHref } from '../router'
import { blip } from '../sound'

export function PostRow({ p }: { p: PostMeta }) {
  return (
    <li>
      <a className="post-row" href={postHref(p.slug)} onClick={() => blip(1200)}>
        <span className="mono post-date">{formatDate(p.date)}</span>
        <span className="post-main">
          <span className="post-title">
            {p.title}
            {p.draft && <span className="tag draft">Draft</span>}
          </span>
          {p.summary && <span className="post-sum">{p.summary}</span>}
        </span>
        <span className="mono post-min">{p.minutes} min ↗</span>
      </a>
    </li>
  )
}

export function Empty() {
  return (
    <div className="empty panel">
      <p className="dot">No signal.</p>
      <p className="mono dim">No posts yet. Check back soon.</p>
    </div>
  )
}

export function BlogIndex() {
  const tags = [...new Set(posts.flatMap((p) => p.tags))].sort()
  const [tag, setTag] = useState<string | null>(null)
  const shown = tag ? posts.filter((p) => p.tags.includes(tag)) : posts

  useEffect(() => {
    document.title = 'Blog · Shivam Panda'
    return () => void (document.title = 'Shivam Panda')
  }, [])

  return (
    <section className="section page">
      <a className="mono back" href="#writing">← Home</a>
      <SectionHead n="LOG" title="Blog" note={`${shown.length} entries`} />
      {tags.length > 0 && (
        <div className="filters mono">
          {[null, ...tags].map((t) => (
            <button key={t ?? 'all'} className={tag === t ? 'on' : ''} onClick={() => setTag(t)}>
              {t ?? 'All'}
            </button>
          ))}
        </div>
      )}
      {shown.length ? <ul className="post-list">{shown.map((p) => <PostRow key={p.slug} p={p} />)}</ul> : <Empty />}
    </section>
  )
}

export function Post({ slug }: { slug: string }) {
  const i = posts.findIndex((p) => p.slug === slug)
  const meta = posts[i]
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    if (!meta) return
    let live = true
    document.title = `${meta.title} · Shivam Panda`
    loaders[slug]()
      .then((raw) => render(parse(raw).body))
      .then((h) => live && setHtml(h))
      .catch(() => live && setHtml('<p>Could not load this post.</p>'))
    return () => {
      live = false
      document.title = 'Shivam Panda'
    }
  }, [slug, meta])

  if (!meta)
    return (
      <section className="section page">
        <a className="mono back" href="#/blog">← All posts</a>
        <div className="empty panel">
          <p className="dot">404.</p>
          <p className="mono dim">That post doesn’t exist, or it hasn’t been published yet.</p>
        </div>
      </section>
    )

  const newer = posts[i - 1]
  const older = posts[i + 1]
  return (
    <article className="section page post">
      <a className="mono back" href="#/blog">← All posts</a>
      <header className="post-head">
        <p className="mono dim">
          <span className="rec" /> {formatDate(meta.date)} · {meta.minutes} min read
          {meta.draft && <span className="tag draft">Draft</span>}
        </p>
        <h1>{meta.title}</h1>
        {meta.summary && <p className="post-lede">{meta.summary}</p>}
        {meta.tags.length > 0 && (
          <ul className="chips mono">
            {meta.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </header>
      {html === null ? (
        <p className="mono dim loading">Loading…</p>
      ) : (
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      <nav className="post-nav mono">
        {newer ? <a href={postHref(newer.slug)}>← {newer.title}</a> : <span />}
        {older ? <a href={postHref(older.slug)}>{older.title} →</a> : <span />}
      </nav>
    </article>
  )
}
