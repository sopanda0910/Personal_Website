import { useEffect, useMemo, useRef, useState } from 'react'
import { createModes, inMask, LED_COUNT, N, type Dir } from '../glyph/modes'
import { blip } from '../sound'

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
}

export default function GlyphMatrix({ theme }: { theme: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const modes = useMemo(() => createModes(), [])
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [mi, setMi] = useState(reduced ? 3 : 0)
  const [score, setScore] = useState<number | null>(null)
  const mode = modes[mi]

  // render loop
  useEffect(() => {
    const cv = canvas.current!
    const g = cv.getContext('2d')!
    const buf = new Float32Array(N * N)
    const css = getComputedStyle(document.documentElement)
    const on = css.getPropertyValue('--ink').trim() || '#fff'
    const off = css.getPropertyValue('--led-off').trim() || 'rgba(128,128,128,.15)'
    let raf = 0
    let last = performance.now()
    let visible = true
    let size = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = cv.clientWidth
      cv.width = cv.height = Math.round(size * dpr)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(cv)

    mode.reset()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.1)
      if (!visible || (reduced && mode.id !== 'snake' && now - last < 1000)) return
      last = now
      mode.step(dt, buf)
      if (mode.score) setScore(mode.score())
      const cell = size / N
      const r = cell * 0.36
      g.clearRect(0, 0, size, size)
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          if (!inMask(x, y)) continue
          const cx = (x + 0.5) * cell
          const cy = (y + 0.5) * cell
          g.globalAlpha = 1
          g.fillStyle = off
          g.beginPath()
          g.arc(cx, cy, r, 0, Math.PI * 2)
          g.fill()
          const v = buf[y * N + x]
          if (v > 0.02) {
            g.globalAlpha = Math.min(1, v)
            g.fillStyle = on
            g.beginPath()
            g.arc(cx, cy, r, 0, Math.PI * 2)
            g.fill()
          }
        }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [mode, theme, reduced])

  // snake controls: keyboard
  useEffect(() => {
    if (!mode.key) return
    const onKey = (e: KeyboardEvent) => {
      const d = KEYS[e.key]
      if (!d) return
      const r = canvas.current!.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) return
      e.preventDefault()
      mode.key!(d)
      blip(660, 0.02)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode])

  // snake controls: swipe / tap
  const touch = useRef<[number, number] | null>(null)
  const onPointerDown = (e: React.PointerEvent) => (touch.current = [e.clientX, e.clientY])
  const onPointerUp = (e: React.PointerEvent) => {
    if (!mode.key || !touch.current) return
    const dx = e.clientX - touch.current[0]
    const dy = e.clientY - touch.current[1]
    touch.current = null
    if (Math.hypot(dx, dy) < 12) {
      // tap: steer toward the tapped side relative to center
      const r = canvas.current!.getBoundingClientRect()
      const tx = e.clientX - (r.left + r.width / 2)
      const ty = e.clientY - (r.top + r.height / 2)
      mode.key(Math.abs(tx) > Math.abs(ty) ? (tx > 0 ? 'right' : 'left') : ty > 0 ? 'down' : 'up')
    } else mode.key(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
    blip(660, 0.02)
  }

  const shift = (k: number) => {
    setMi((i) => (i + k + modes.length) % modes.length)
    blip(k > 0 ? 1320 : 990)
  }

  return (
    <div className="device">
      <span className="screw tl" /><span className="screw tr" /><span className="screw bl" /><span className="screw br" />
      <div className="device-top mono">
        <span>GLYPH MATRIX</span>
        <span>{N}×{N} · {LED_COUNT} LED</span>
      </div>
      <canvas
        ref={canvas}
        className={`matrix${mode.key ? ' playable' : ''}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        role="img"
        aria-label={`Glyph matrix animation: ${mode.label}`}
      />
      <div className="device-controls">
        <button className="key" onClick={() => shift(-1)} aria-label="Previous glyph toy">◀</button>
        <div className="readout">
          <div className="mono readout-label">
            <span className="rec" /> {String(mi + 1).padStart(2, '0')} / {mode.label}
            {mode.key && score !== null && <span className="score"> · SCORE {String(score).padStart(3, '0')}</span>}
          </div>
          <div className="readout-hint">{mode.hint}</div>
        </div>
        <button className="key" onClick={() => shift(1)} aria-label="Next glyph toy">▶</button>
      </div>
    </div>
  )
}
