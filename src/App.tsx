import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import GlyphMatrix from './components/GlyphMatrix'
import StatusBar from './components/StatusBar'
import { About, Contact, Education, Projects, Work, Writing } from './components/Sections'
import Boot from './components/Boot'
import { BlogIndex, Post } from './pages/Blog'
import { focus, profile } from './data'
import { hasBlog, SECTIONS } from './sections'
import { useRoute } from './router'
import { blip, setSound } from './sound'

// Loaded as its own chunk, only when its route is opened.
const Admin = lazy(() => import('./pages/Admin'))

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* storage unavailable */
    }
  },
}

function Home({ theme }: { theme: string }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="mono eyebrow">
            <span className="rec" /> {profile.role} · {profile.location}
          </p>
          <h1 className="dot name">
            <span>{profile.first}</span>
            <span>
              {profile.last}
              <span className="red">.</span>
            </span>
          </h1>
          <p className="lede">{profile.lede}</p>
          <div className="hero-cta">
            <a className="btn primary" href="#work">
              <span className="mono">View work ↓</span>
            </a>
            <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
              <span className="mono">GitHub ↗</span>
            </a>
            <a className="btn" href={`mailto:${profile.email}`}>
              <span className="mono">Email ↗</span>
            </a>
          </div>
        </div>
        <GlyphMatrix theme={theme} />
        <dl className="hero-stats">
          {focus.map((f) => (
            <div key={f.word}>
              <dt className="dot">{f.word}</dt>
              <dd className="mono">{f.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <About />
      <Work />
      <Projects />
      <Education />
      {hasBlog && <Writing />}
      <Contact />
    </>
  )
}

export default function App() {
  const route = useRoute()
  const [theme, setTheme] = useState(
    () => store.get('theme') ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
  )
  const [sound, setSoundOn] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#000000' : '#efefec')
  }, [theme])

  // After a route change: pages start at the top; home anchors scroll to their section
  // (the browser can't do it itself when the section wasn't rendered yet).
  const prev = useRef(route.name)
  useEffect(() => {
    // arriving from another page: jump; moving within the home page: glide
    const behavior: ScrollBehavior = prev.current === 'home' ? 'smooth' : 'instant'
    prev.current = route.name
    if (route.name !== 'home' || route.anchor === 'top') return window.scrollTo({ top: 0, behavior })
    if (route.anchor) document.getElementById(route.anchor)?.scrollIntoView({ behavior })
  }, [route])

  // Number keys jump between sections, like hardware shortcut keys.
  useEffect(() => {
    let typed = ''
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input,textarea,select,[contenteditable]')) return
      typed = (typed + e.key).slice(-4).toLowerCase()
      if (typed === 'sudo') {
        location.hash = '#/admin'
        blip(1760, 0.08, 'sine', 0.05)
        return
      }
      const i = Number(e.key) - 1
      if (i >= 0 && i < SECTIONS.length) {
        const id = SECTIONS[i].id
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
        else location.hash = `#${id}`
        blip(1000)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    store.set('theme', next)
    blip(next === 'dark' ? 520 : 1040, 0.05)
  }

  const toggleSound = () => {
    setSound(!sound)
    setSoundOn(!sound)
    if (!sound) setTimeout(() => blip(1320, 0.06, 'sine', 0.05), 30)
  }

  return (
    <>
      {route.name === 'home' && <Boot />}
      <StatusBar route={route} theme={theme} onTheme={toggleTheme} sound={sound} onSound={toggleSound} />
      <main id="top">
        {route.name === 'home' && <Home theme={theme} />}
        {route.name === 'blog' && <BlogIndex />}
        {route.name === 'post' && <Post key={route.slug} slug={route.slug} />}
        {route.name === 'admin' && (
          <Suspense fallback={<p className="section mono dim">Loading console…</p>}>
            <Admin />
          </Suspense>
        )}
      </main>
      <footer className="footer mono">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span className="dim">Press 1–{SECTIONS.length} to jump between sections · ◀ ▶ changes the matrix toy · Toy 05 is Snake</span>
        <span className="dim">Built with Preact + Vite · No trackers</span>
      </footer>
    </>
  )
}
