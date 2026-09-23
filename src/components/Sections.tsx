import { useState, type ReactNode } from 'react'
import { about, archive, education, experience, profile, projects, spec, type Category } from '../data'
import { posts } from 'virtual:posts'
import { Empty, PostRow } from '../pages/Blog'
import { blip } from '../sound'

export function SectionHead({ n, title, note }: { n: string; title: string; note?: string }) {
  return (
    <div className="section-head">
      <span className="mono idx">{n}</span>
      <h2 className="dot">{title}</h2>
      <span className="rule" />
      {note && <span className="mono note">{note}</span>}
    </div>
  )
}

export function About() {
  return (
    <section id="about" className="section">
      <SectionHead n="01" title="About" note="Spec sheet" />
      <div className="about-grid">
        <div className="about-copy">
          {about.map((p) => (
            <p key={p.slice(0, 16)}>{p}</p>
          ))}
        </div>
        <dl className="spec panel">
          {spec.map(([k, v]) => (
            <div key={k} className="spec-row">
              <dt className="mono">{k}</dt>
              <dd>
                {k === 'Status' && <span className="rec" />} {v}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function Work() {
  return (
    <section id="work" className="section">
      <SectionHead n="02" title="Work" note="Research · Quant · Engineering" />
      {profile.resume && (
        <div className="resume-row">
          <a className="btn primary" href={profile.resume} target="_blank" rel="noreferrer">
            <span className="mono">Résumé (PDF) ↗</span>
          </a>
          <span className="mono dim">One page · everything below, condensed</span>
        </div>
      )}
      <ol className="log">
        {experience.map((e, i) => (
          <li key={e.org} className="log-item panel">
            <div className="log-meta mono">
              <span className="log-no">E/{String(i + 1).padStart(2, '0')}</span>
              <span>{e.when}</span>
              <span className="dim">{e.where}</span>
              <span className={`tag kind-${e.kind.toLowerCase()}`}>{e.kind}</span>
            </div>
            <div className="log-body">
              <h3>{e.org}</h3>
              <p className="role">
                {e.role}
                {e.collab && <span className="dim"> · {e.collab}</span>}
              </p>
              <p className="did">{e.did}</p>
              {e.learned && (
                <p className="learned">
                  <span className="mono">Learned</span>
                  {e.learned}
                </p>
              )}
              {e.links && (
                <div className="log-links">
                  {e.links.map((l) => (
                    <a key={l.url} className="btn small-btn" href={l.url} target="_blank" rel="noreferrer">
                      <span className="mono">{l.label} ↗</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

const FILTERS: ('All' | Category)[] = ['All', 'Physics', 'Astro', 'Software', 'Engineering']

export function Projects() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const shown = projects.filter((p) => filter === 'All' || p.category === filter)
  return (
    <section id="projects" className="section">
      <SectionHead n="03" title="Projects" note={`${shown.length} loaded`} />
      <div className="filters mono" role="tablist" aria-label="Filter projects">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={filter === f ? 'on' : ''}
            onClick={() => {
              setFilter(f)
              blip(filter === f ? 700 : 1100)
            }}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid">
        {shown.map((p) => {
          const n = String(projects.indexOf(p) + 1).padStart(2, '0')
          const body: ReactNode = (
            <>
              <div className="card-top mono">
                <span>P/{n}</span>
                <span className="tag">{p.category}</span>
                <span className="led" aria-hidden />
              </div>
              <h3>{p.title}</h3>
              <p>{p.blurb}</p>
              <div className="card-foot">
                <ul className="chips mono">
                  {p.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <span className="mono go">{p.repo ? 'REPO ↗' : 'OFFLINE'}</span>
              </div>
            </>
          )
          return p.repo ? (
            <a key={p.title} className="card panel" href={p.repo} target="_blank" rel="noreferrer" onMouseEnter={() => blip(1500, 0.015)}>
              {body}
            </a>
          ) : (
            <div key={p.title} className="card panel">
              {body}
            </div>
          )
        })}
      </div>
      <div className="archive">
        <div className="mono archive-head">
          <span>Archive</span>
          <span className="dim">Notes, practice and early work</span>
        </div>
        <ul>
          {archive.map((a) => (
            <li key={a.title}>
              <a href={a.repo} target="_blank" rel="noreferrer">
                <span className="a-title">{a.title}</span>
                <span className="a-note dim">{a.note}</span>
                <span className="mono">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Education() {
  return (
    <section id="education" className="section">
      <SectionHead n="04" title="Education" />
      <div className="edu">
        {education.map((e) => (
          <article key={e.school} className="panel edu-item">
            <div className="mono edu-when">{e.when}</div>
            <h3>{e.school}</h3>
            <p className="dim">{e.sub}</p>
            <ul className="chips mono">
              {e.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export function Writing() {
  const latest = posts.slice(0, 3)
  return (
    <section id="writing" className="section">
      <SectionHead n="05" title="Blog" note="Latest entries" />
      {latest.length ? (
        <ul className="post-list">
          {latest.map((p) => (
            <PostRow key={p.slug} p={p} />
          ))}
        </ul>
      ) : (
        <Empty />
      )}
      <a className="btn all-posts" href="#/blog">
        <span className="mono">All posts →</span>
      </a>
    </section>
  )
}

export function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      blip(1760, 0.06, 'sine', 0.05)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }
  return (
    <section id="contact" className="section contact">
      <SectionHead n="06" title="Contact" />
      <p className="dot huge">Say hello.</p>
      <p className="contact-sub">Research, internships, race cars or physics questions: my inbox is open.</p>
      <div className="contact-row">
        <button className="btn primary" onClick={copy}>
          <span className="mono">{copied ? 'COPIED ✓' : profile.email}</span>
        </button>
        <a className="btn" href={`mailto:${profile.email}`}>
          <span className="mono">Email ↗</span>
        </a>
        <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
          <span className="mono">GitHub ↗</span>
        </a>
        <a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer">
          <span className="mono">LinkedIn ↗</span>
        </a>
        {profile.resume && (
          <a className="btn" href={profile.resume} target="_blank" rel="noreferrer">
            <span className="mono">Résumé ↗</span>
          </a>
        )}
      </div>
    </section>
  )
}
