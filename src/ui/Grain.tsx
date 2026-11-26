import { useEffect, useRef } from 'react'

// Animated film grain: creates high-contrast noise tiles cycling at 12 fps
export default function Grain() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const S = 128 // small tiles keep the grain fine on light paper
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = S
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Pre-generate 4 random noise frames for a subtle, natural film flutter
    const tiles: string[] = []
    for (let frame = 0; frame < 4; frame++) {
      const img = ctx.createImageData(S, S)
      const data = new Uint32Array(img.data.buffer)
      for (let i = 0; i < data.length; i++) {
        // High-contrast film grain: sharp monochrome granules with varying alpha
        const isWhite = Math.random() > 0.5
        const v = isWhite ? 255 : 0
        const alpha = Math.floor(Math.random() * 110 + 40)
        data[i] = (alpha << 24) | (v << 16) | (v << 8) | v
      }
      ctx.putImageData(img, 0, 0)
      tiles.push(`url(${canvas.toDataURL('image/png')})`)
    }

    el.style.backgroundImage = tiles[0]

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let f = 0
    const id = window.setInterval(() => {
      f = (f + 1) % tiles.length
      el.style.backgroundImage = tiles[f]
    }, 80)

    return () => clearInterval(id)
  }, [])

  return <div ref={ref} className="grain" aria-hidden="true" />
}
