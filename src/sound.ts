// Tiny WebAudio blips for UI feedback. Off by default.

let ctx: AudioContext | null = null
let enabled = false

export const setSound = (on: boolean) => {
  enabled = on
  if (on && !ctx) ctx = new AudioContext()
}

export function blip(freq = 880, dur = 0.035, type: OscillatorType = 'square', gain = 0.035) {
  if (!enabled || !ctx) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur + 0.01)
}
