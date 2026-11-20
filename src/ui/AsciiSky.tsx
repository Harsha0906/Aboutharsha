import { pointer } from '../state'

// Sky-blue background with drifting clouds drawn only in ASCII characters.
// Each cloud is a cluster of round puffs with a flat base; denser = heavier glyph.
// It draws into an offscreen canvas that the 3D scene uses as its background,
// so the avatar and props composite cleanly over it (and get depth of field).


export const sky = { canvas: null as HTMLCanvasElement | null, frame: 0 }

export function startAsciiSky() {
  if (sky.canvas || typeof document === 'undefined') return sky
  const cv = document.createElement('canvas')
  sky.canvas = cv
  const ctx = cv.getContext('2d')!
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let W = 0, H = 0, cw = 0, ch = 0, cols = 0, rows = 0, dpr = 1, fs = 12
  let grad: CanvasGradient
  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1)
    W = window.innerWidth
    H = window.innerHeight
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
    fs = W < 760 ? 9 : 12
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.font = `${fs}px "JetBrains Mono", ui-monospace, monospace`
    ctx.textBaseline = 'top'
    cw = fs * 0.62
    ch = fs * 1.15
    cols = Math.ceil(W / cw)
    rows = Math.ceil(H / ch)
    grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#4f9ad6')
    grad.addColorStop(0.55, '#79b8e8')
    grad.addColorStop(1, '#bfe0f7')
  }
  resize()
  window.addEventListener('resize', resize)

  // a handful of cumulus clouds, each a cluster of round puffs with a flat base
  type Cloud = { x: number; y: number; w: number; speed: number; depth: number; puffs: { dx: number; dy: number; r: number }[] }
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const makeCloud = (x: number, y: number, w: number): Cloud => {
    const n = 5 + Math.floor(rnd() * 3)
    const puffs = []
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n
      const hump = Math.sin(u * Math.PI) // taller in the middle
      const r = w * (0.13 + 0.12 * hump + rnd() * 0.05)
      puffs.push({ dx: (u - 0.5) * w * 0.82, dy: -r * (0.35 + 0.5 * hump), r })
    }
    // one big crown puff
    puffs.push({ dx: (rnd() - 0.5) * w * 0.2, dy: -w * 0.24, r: w * 0.2 })
    const depth = w / 520
    return { x, y, w, speed: 16 + depth * 34, depth, puffs }
  }
  const clouds: Cloud[] = [
    makeCloud(0.12, 0.2, 300),
    makeCloud(0.52, 0.12, 220),
    makeCloud(0.85, 0.3, 380),
    makeCloud(0.33, 0.48, 460),
    makeCloud(0.72, 0.66, 300),
    makeCloud(0.05, 0.8, 360),
    makeCloud(0.55, 0.92, 520),
  ]
  const RAMP2 = ' .:-=+*'

  let last = 0
  let px = 0, py = 0
  const draw = (now: number) => {
    requestAnimationFrame(draw)
    if (now - last < 33 || (reduce && sky.frame > 0 && now - last < 1000)) return // ~30 fps
    last = now
    const t = reduce ? 0 : now / 1000
    px += ((pointer.active ? pointer.x : 0) - px) * 0.05
    py += ((pointer.active ? pointer.y : 0) - py) * 0.05
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    const scale = Math.min(1.25, Math.max(0.55, W / 1440))
    for (const c of clouds) {
      // drift right and wrap; climb with scroll; nearer clouds move more (parallax)
      const span = W + c.w * scale * 2
      const cx = ((c.x * W + t * c.speed * scale + px * 30 * c.depth) % span + span) % span - c.w * scale
      const cy = c.y * H - window.scrollY * (0.08 + 0.12 * c.depth) - py * 14 * c.depth
      const w = c.w * scale
      // character-grid bounding box
      const x0 = Math.max(0, Math.floor((cx - w * 0.75) / cw)), x1 = Math.min(cols - 1, Math.ceil((cx + w * 0.75) / cw))
      const y0 = Math.max(0, Math.floor((cy - w * 0.7) / ch)), y1 = Math.min(rows - 1, Math.ceil((cy + w * 0.08) / ch))
      for (let r = y0; r <= y1; r++) {
        const yy = r * ch + ch / 2
        for (let col = x0; col <= x1; col++) {
          const xx = col * cw + cw / 2
          let d = 0
          for (let pi = 0; pi < c.puffs.length; pi++) {
            const p = c.puffs[pi]
            // each puff slowly breathes and wobbles, so the cloud shape keeps changing
            const ph = t * 0.5 + pi * 1.7 + c.x * 9
            const pr = p.r * scale * (1 + 0.09 * Math.sin(ph))
            const dx = xx - (cx + (p.dx + Math.sin(ph * 0.7) * 6) * scale), dy = yy - (cy + (p.dy + Math.cos(ph * 0.6) * 4) * scale)
            const v = 1 - Math.sqrt(dx * dx + dy * dy) / pr
            if (v > d) d = v
          }
          // flat, soft base
          d = Math.min(d, (cy - yy) / (w * 0.06) + 0.25)
          if (d <= 0.02) continue
          const k = Math.min(1, d * 2.2 + (d < 0.18 ? Math.sin(col * 12.9 + r * 7.3 + t * 3) * 0.12 : 0))
          const g = RAMP2[Math.min(RAMP2.length - 1, 1 + Math.floor(k * (RAMP2.length - 1)))]
          // brighter on top, a little shadow toward the base
          const shade = 0.55 + 0.45 * Math.min(1, Math.max(0, (cy - yy) / (w * 0.35)))
          ctx.fillStyle = `rgba(255,255,255,${(0.28 + 0.62 * k * shade).toFixed(2)})`
          ctx.fillText(g, col * cw, r * ch)
        }
      }
    }
    sky.frame++
  }
  requestAnimationFrame(draw)
  return sky
}
