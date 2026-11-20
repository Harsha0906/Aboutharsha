import { pointer } from '../state'

// Sky-blue background with drifting clouds drawn only in ASCII characters.
// Cloud shapes come from layered value noise; denser cloud = heavier glyph.
// It draws into an offscreen canvas that the 3D scene uses as its background,
// so the avatar and props composite cleanly over it (and get depth of field).

const RAMP = ' .·:-=+*o%#@'

function makeNoise(seed: number) {
  const P = new Uint8Array(512)
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255]
  const V = Float32Array.from({ length: 256 }, () => rnd())
  const fade = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = x - xi, yf = y - yi
    const a = V[P[(xi & 255) + P[yi & 255]]], b = V[P[((xi + 1) & 255) + P[yi & 255]]]
    const c = V[P[(xi & 255) + P[(yi + 1) & 255]]], d = V[P[((xi + 1) & 255) + P[(yi + 1) & 255]]]
    const u = fade(xf), v = fade(yf)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
}

export const sky = { canvas: null as HTMLCanvasElement | null, frame: 0 }

export function startAsciiSky() {
  if (sky.canvas || typeof document === 'undefined') return sky
  const cv = document.createElement('canvas')
  sky.canvas = cv
  const ctx = cv.getContext('2d')!
  const noise = makeNoise(7)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let W = 0, H = 0, cw = 0, ch = 0, cols = 0, rows = 0, dpr = 1, fs = 13
  let grad: CanvasGradient
  const resize = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1)
    W = window.innerWidth
    H = window.innerHeight
    cv.width = Math.round(W * dpr)
    cv.height = Math.round(H * dpr)
    fs = W < 760 ? 10 : 13
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

  let last = 0
  let px = 0, py = 0
  const draw = (now: number) => {
    requestAnimationFrame(draw)
    if (now - last < 50 || (reduce && sky.frame > 0 && now - last < 1000)) return // ~20 fps is plenty
    last = now
    const t = now / 1000
    // clouds drift sideways, climb as you scroll, and shift a little with the cursor
    px += ((pointer.active ? pointer.x : 0) * 1.2 - px) * 0.05
    py += ((pointer.active ? pointer.y : 0) * 0.6 - py) * 0.05
    const sx = (reduce ? 0 : t * 0.3) + px
    const sy = window.scrollY / (ch * 10) - py
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)
    for (let r = 0; r < rows; r++) {
      const fy = r / rows
      const bias = -0.6 + fy * 0.14
      for (let c = 0; c < cols; c++) {
        const x = c * 0.03 + sx, y = r * 0.06 + sy
        let n = noise(x, y) * 0.6 + noise(x * 2.3 + 3.3, y * 2.3 - t * 0.04) * 0.28 + noise(x * 5.1, y * 5.1) * 0.12
        n += bias
        if (n <= 0) continue
        const k = Math.min(1, n * 3.6)
        const g = RAMP[Math.min(RAMP.length - 1, 1 + Math.floor(k * (RAMP.length - 1)))]
        ctx.fillStyle = `rgba(255,255,255,${(0.4 + k * 0.6).toFixed(2)})`
        ctx.fillText(g, c * cw, r * ch)
      }
    }
    sky.frame++
  }
  requestAnimationFrame(draw)
  return sky
}
