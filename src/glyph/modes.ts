// Glyph Matrix "toys". Each mode writes brightness values (0..1) into a 25×25 buffer.

export const N = 25
const C = (N - 1) / 2
const R2 = 12.6 * 12.6

export const inMask = (x: number, y: number) => (x - C) ** 2 + (y - C) ** 2 <= R2

export const LED_COUNT = (() => {
  let n = 0
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inMask(x, y)) n++
  return n
})()

export type Buffer = Float32Array

export interface Mode {
  id: string
  label: string
  hint: string
  reset(): void
  step(dt: number, out: Buffer): void
  key?(dir: Dir): void
  score?(): number | null
}

export type Dir = 'up' | 'down' | 'left' | 'right'

const idx = (x: number, y: number) => y * N + x

function plot(buf: Buffer, x: number, y: number, v: number) {
  const ix = Math.round(x)
  const iy = Math.round(y)
  if (ix < 0 || iy < 0 || ix >= N || iy >= N) return
  const i = idx(ix, iy)
  if (buf[i] < v) buf[i] = v
}

function line(buf: Buffer, x0: number, y0: number, x1: number, y1: number, v: number) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1
  for (let s = 0; s <= steps; s++) {
    const t = s / steps
    plot(buf, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, v)
  }
}

// 3×5 pixel digits for the clock and scores
const DIGITS = [
  '111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
  '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111',
]

function drawNumber(buf: Buffer, text: string, cx: number, y: number, v: number) {
  const w = text.length * 4 - 1
  let x = Math.round(cx - w / 2)
  for (const ch of text) {
    if (ch === ':') {
      plot(buf, x, y + 1, v)
      plot(buf, x, y + 3, v)
      x += 2
      continue
    }
    const d = DIGITS[+ch]
    if (d) for (let i = 0; i < 15; i++) if (d[i] === '1') plot(buf, x + (i % 3), y + Math.floor(i / 3), v)
    x += 4
  }
}

/* ---------- Double pendulum (Euler–Lagrange, RK4) ---------- */
function pendulum(): Mode {
  let s = [2.2, 2.6, 0, 0] // θ1, θ2, ω1, ω2
  const trail = new Float32Array(N * N)
  const g = 9.81
  const deriv = ([t1, t2, w1, w2]: number[]) => {
    const d = t1 - t2
    const den = 3 - Math.cos(2 * d)
    const a1 = (-3 * g * Math.sin(t1) - g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(d) * (w2 * w2 + w1 * w1 * Math.cos(d))) / den
    const a2 = (2 * Math.sin(d) * (2 * w1 * w1 + 2 * g * Math.cos(t1) + w2 * w2 * Math.cos(d))) / den
    return [w1, w2, a1, a2]
  }
  const rk4 = (h: number) => {
    const add = (a: number[], b: number[], k: number) => a.map((v, i) => v + b[i] * k)
    const k1 = deriv(s)
    const k2 = deriv(add(s, k1, h / 2))
    const k3 = deriv(add(s, k2, h / 2))
    const k4 = deriv(add(s, k3, h))
    s = s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]))
  }
  return {
    id: 'pendulum',
    label: 'DOUBLE PENDULUM',
    hint: 'Chaos from two rods. RK4 on the Euler–Lagrange equations.',
    reset() {
      s = [2 + Math.random(), 2.4 + Math.random(), 0, 0]
      trail.fill(0)
    },
    step(dt, out) {
      const sub = 8
      for (let i = 0; i < sub; i++) rk4(Math.min(dt, 0.05) / sub)
      const L = 5.6
      const x1 = C + L * Math.sin(s[0])
      const y1 = C + L * Math.cos(s[0])
      const x2 = x1 + L * Math.sin(s[1])
      const y2 = y1 + L * Math.cos(s[1])
      for (let i = 0; i < trail.length; i++) trail[i] *= 0.965
      plot(trail, x2, y2, 1)
      for (let i = 0; i < out.length; i++) out[i] = trail[i] * 0.55
      line(out, C, C, x1, y1, 0.8)
      line(out, x1, y1, x2, y2, 0.8)
      plot(out, x1, y1, 1)
      plot(out, x2, y2, 1)
    },
  }
}

/* ---------- Precessing orbit (1/r² + small 1/r⁴ correction) ---------- */
function orbit(): Mode {
  let p = [0, 0, 0, 0]
  const trail = new Float32Array(N * N)
  return {
    id: 'orbit',
    label: 'ORBIT',
    hint: 'Kepler plus a small 1/r⁴ correction, so the ellipse precesses.',
    reset() {
      p = [10.5, 0, 0, 0.16]
      trail.fill(0)
    },
    step(dt, out) {
      const sub = 30
      const h = (Math.min(dt, 0.05) * 60) / sub
      for (let i = 0; i < sub; i++) {
        const r = Math.hypot(p[0], p[1])
        const f = -0.45 / (r * r) - 0.8 / r ** 4
        p[2] += (f * p[0]) / r * h
        p[3] += (f * p[1]) / r * h
        p[0] += p[2] * h
        p[1] += p[3] * h
      }
      for (let i = 0; i < trail.length; i++) trail[i] *= 0.992
      plot(trail, C + p[0], C + p[1], 1)
      for (let i = 0; i < out.length; i++) out[i] = trail[i] * 0.5
      plot(out, C + p[0], C + p[1], 1)
      plot(out, C, C, 1)
      plot(out, C + 1, C, 0.35)
      plot(out, C - 1, C, 0.35)
      plot(out, C, C + 1, 0.35)
      plot(out, C, C - 1, 0.35)
    },
  }
}

/* ---------- 2D compact U(1) lattice gauge theory, Metropolis ---------- */
function lattice(): Mode {
  const beta = 1.6
  const links = [new Float32Array(N * N), new Float32Array(N * N)] // μ = x, y
  const shown = new Float32Array(N * N)
  const w = (i: number) => (i + N) % N
  const plaq = (x: number, y: number) =>
    links[0][idx(x, y)] + links[1][idx(w(x + 1), y)] - links[0][idx(x, w(y + 1))] - links[1][idx(x, y)]
  const update = () => {
    for (let n = 0; n < N * N * 2; n++) {
      const mu = n & 1
      const x = (Math.random() * N) | 0
      const y = (Math.random() * N) | 0
      // the two plaquettes containing this link
      const pa = mu === 0 ? [[x, y], [x, w(y - 1)]] : [[x, y], [w(x - 1), y]]
      const before = pa.reduce((a, [px, py]) => a + Math.cos(plaq(px, py)), 0)
      const old = links[mu][idx(x, y)]
      links[mu][idx(x, y)] = old + (Math.random() - 0.5) * 2.4
      const after = pa.reduce((a, [px, py]) => a + Math.cos(plaq(px, py)), 0)
      if (Math.random() > Math.exp(beta * (after - before))) links[mu][idx(x, y)] = old
    }
  }
  let acc = 0
  return {
    id: 'lattice',
    label: 'U(1) LATTICE β=1.6',
    hint: 'Live Metropolis on compact U(1). Brightness is 1 − cos of each plaquette.',
    reset() {
      for (const l of links) for (let i = 0; i < l.length; i++) l[i] = (Math.random() - 0.5) * 2 * Math.PI
      shown.fill(0)
    },
    step(dt, out) {
      acc += dt
      if (acc > 0.08) {
        acc = 0
        update()
      }
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const t = (1 - Math.cos(plaq(x, y))) / 2
          const i = idx(x, y)
          shown[i] += (t - shown[i]) * Math.min(1, dt * 6)
          out[i] = shown[i] ** 1.6
        }
    },
  }
}

/* ---------- Clock ---------- */
function clock(): Mode {
  let t = 0
  return {
    id: 'clock',
    label: 'OXFORD TIME',
    hint: 'Europe/London. Where I probably am.',
    reset() {},
    step(dt, out) {
      t += dt
      out.fill(0)
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      }).formatToParts(new Date())
      const get = (k: string) => parts.find((p) => p.type === k)?.value ?? '00'
      drawNumber(out, get('hour'), C, 6, 1)
      drawNumber(out, get('minute'), C, 13, 1)
      // seconds sweep around the rim
      const sec = +get('second') + (t % 1)
      const a = (sec / 60) * Math.PI * 2 - Math.PI / 2
      for (let k = 0; k < 6; k++) {
        const b = a - k * 0.09
        plot(out, C + 11.4 * Math.cos(b), C + 11.4 * Math.sin(b), 1 - k * 0.16)
      }
    },
  }
}

/* ---------- Snake ---------- */
function snake(): Mode {
  let body: [number, number][] = []
  let dir: [number, number] = [1, 0]
  let queued: [number, number][] = []
  let food: [number, number] = [0, 0]
  let acc = 0
  let dead = false
  let started = false
  let flash = 0
  let score = 0
  const place = () => {
    for (;;) {
      const f: [number, number] = [(Math.random() * N) | 0, (Math.random() * N) | 0]
      if (inMask(...f) && !body.some(([x, y]) => x === f[0] && y === f[1])) return (food = f)
    }
  }
  const vec: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
  return {
    id: 'snake',
    label: 'SNAKE',
    hint: 'Arrow keys / WASD / swipe. Stay inside the circle.',
    reset() {
      body = [[12, 12], [11, 12], [10, 12]]
      dir = [1, 0]
      queued = []
      dead = false
      started = false
      score = 0
      flash = 0
      place()
    },
    key(d) {
      if (dead) return this.reset()
      started = true
      const last = queued[queued.length - 1] ?? dir
      const v = vec[d]
      if (v[0] === -last[0] && v[1] === -last[1]) return
      if (queued.length < 3) queued.push(v)
    },
    score: () => score,
    step(dt, out) {
      out.fill(0)
      if (dead) {
        flash += dt
        drawNumber(out, String(score), C, 10, flash % 0.8 < 0.5 ? 1 : 0.3)
        return
      }
      if (started) acc += dt
      const period = Math.max(0.07, 0.14 - score * 0.003)
      while (acc > period) {
        acc -= period
        if (queued.length) dir = queued.shift()!
        const head: [number, number] = [body[0][0] + dir[0], body[0][1] + dir[1]]
        if (!inMask(...head) || body.some(([x, y]) => x === head[0] && y === head[1])) {
          dead = true
          break
        }
        body.unshift(head)
        if (head[0] === food[0] && head[1] === food[1]) {
          score++
          place()
        } else body.pop()
      }
      body.forEach(([x, y], i) => plot(out, x, y, i === 0 ? 1 : Math.max(0.45, 0.9 - i * 0.02)))
      plot(out, food[0], food[1], 0.6 + 0.4 * Math.sin(performance.now() / 120))
    },
  }
}

export const createModes = (): Mode[] => [pendulum(), orbit(), lattice(), clock(), snake()]
