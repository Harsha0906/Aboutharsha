import { useEffect, useRef } from 'react'

// Animated film grain: a few small noise tiles, repeated across the screen and cycled.
export default function Grain() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const S = 180
    const c = document.createElement('canvas')
    c.width = c.height = S
    const ctx = c.getContext('2d')!
    const tiles = Array.from({ length: 5 }, () => {
      const img = ctx.createImageData(S, S)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
      return `url(${c.toDataURL('image/png')})`
    })
    el.style.backgroundImage = tiles[0]
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let f = 0
    const id = window.setInterval(() => {
      el.style.backgroundImage = tiles[++f % tiles.length]
    }, 90)
    return () => clearInterval(id)
  }, [])
  return <div ref={ref} className="grain" aria-hidden="true" />
}
