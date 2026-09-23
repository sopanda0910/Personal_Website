import { useEffect, useState } from 'react'
import { SECTIONS } from '../data'
import type { Route } from '../router'
import { blip } from '../sound'

const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false })

type Props = {
  route: Route
  theme: string
  onTheme: () => void
  sound: boolean
  onSound: () => void
}

export default function StatusBar({ route, theme, onTheme, sound, onSound }: Props) {
  const [time, setTime] = useState(() => fmt.format(new Date()))
  const [active, setActive] = useState('')

  useEffect(() => {
    const t = setInterval(() => setTime(fmt.format(new Date())), 10_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (route.name !== 'home') return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [route.name])

  const current = route.name === 'home' ? active : route.name === 'admin' ? '' : 'writing'

  return (
    <header className="statusbar">
      <a href="#top" className="brand mono" onClick={() => blip(1200)}>
        <span className="rec" />
        SP<span className="dim">/26</span>
      </a>
      <nav className="nav mono" aria-label="Sections">
        {SECTIONS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className={current === s.id ? 'on' : ''} onClick={() => blip(1000)}>
            <span className="num">0{i + 1}</span>
            <span className="lbl">{s.label}</span>
            <span className="short">{s.short}</span>
          </a>
        ))}
      </nav>
      <div className="sys mono">
        <span className="clock" title="Oxford time">OXF {time}</span>
        <button onClick={onSound} aria-pressed={sound} title="UI sounds">
          SND {sound ? 'ON' : 'OFF'}
        </button>
        <button onClick={onTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Theme">
          <span className={`toggle ${theme}`} />
        </button>
      </div>
    </header>
  )
}
