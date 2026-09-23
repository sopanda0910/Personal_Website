import { useEffect, useState } from 'react'

// A short power-on sequence, shown once per browser session. Any key or click skips it.
const DOTS = 24

function seen() {
  try {
    return sessionStorage.getItem('booted') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export default function Boot() {
  const [lit, setLit] = useState(0)
  const [gone, setGone] = useState(seen)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (gone) return
    try {
      sessionStorage.setItem('booted', '1')
    } catch {
      /* ignore */
    }
    const finish = () => {
      setFading(true)
      setTimeout(() => setGone(true), 350)
    }
    const t = setInterval(() => setLit((n) => (n >= DOTS ? n : n + 1)), 34)
    const done = setTimeout(finish, DOTS * 34 + 250)
    window.addEventListener('keydown', finish, { once: true })
    window.addEventListener('pointerdown', finish, { once: true })
    return () => {
      clearInterval(t)
      clearTimeout(done)
      window.removeEventListener('keydown', finish)
      window.removeEventListener('pointerdown', finish)
    }
  }, [gone])

  if (gone) return null
  return (
    <div className={`boot${fading ? ' out' : ''}`} aria-hidden>
      <div className="boot-inner">
        <p className="dot boot-logo">
          SP<span className="red">.</span>
        </p>
        <div className="boot-bar">
          {Array.from({ length: DOTS }, (_, i) => (
            <span key={i} className={i < lit ? 'on' : ''} />
          ))}
        </div>
        <p className="mono boot-text">{lit < DOTS ? 'Powering on' : 'Ready'}</p>
      </div>
    </div>
  )
}
