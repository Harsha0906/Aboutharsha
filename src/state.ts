// Tiny shared state read every frame by the 3D scene (kept outside React on purpose:
// scroll and pointer change 60 times a second and must not re-render the page).

export const pointer = {
  x: 0, // -1..1, left to right
  y: 0, // -1..1, bottom to top
  active: false,
}

export const scroll = {
  /** fractional section index: 2.5 = halfway between section 2 and 3 */
  t: 0,
  /** overall page progress 0..1 */
  p: 0,
  /** critically damped copy of `t` (updated in motion.ts): the camera and the section reveals follow this */
  smooth: 0,
  /** number of section stops on the page */
  stops: 8,
}

if (typeof window !== 'undefined') {
  const onMove = (x: number, y: number) => {
    pointer.x = (x / window.innerWidth) * 2 - 1
    pointer.y = -((y / window.innerHeight) * 2 - 1)
    pointer.active = true
  }
  window.addEventListener('pointermove', (e) => onMove(e.clientX, e.clientY), { passive: true })
  window.addEventListener('touchmove', (e) => e.touches[0] && onMove(e.touches[0].clientX, e.touches[0].clientY), {
    passive: true,
  })
  document.addEventListener('pointerleave', () => (pointer.active = false))

  const measure = () => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-stop]'))
    if (!els.length) return
    const scrollY = window.scrollY
    const vh = window.innerHeight
    const refOffset = vh * 0.35 // comfortable reading reference line
    const refLine = scrollY + refOffset
    const tops = els.map((el) => el.offsetTop)
    const n = tops.length
    scroll.stops = n

    let t = 0
    if (scrollY <= 0) {
      t = 0
    } else if (n > 1 && scrollY < tops[1] - refOffset) {
      // Smooth continuous hero exit into section 1
      const heroRange = Math.max(1, tops[1] - refOffset)
      t = Math.min(1, Math.max(0, scrollY / heroRange))
    } else if (refLine >= tops[n - 1]) {
      t = n - 1
    } else {
      for (let i = 1; i < n - 1; i++) {
        if (refLine <= tops[i + 1]) {
          const range = Math.max(1, tops[i + 1] - tops[i])
          t = i + (refLine - tops[i]) / range
          break
        }
      }
    }
    scroll.t = Math.min(Math.max(0, t), n - 1)
    const max = document.documentElement.scrollHeight - vh
    scroll.p = max > 0 ? scrollY / max : 0
  }
  window.addEventListener('scroll', measure, { passive: true })
  window.addEventListener('resize', measure)
  ;(window as unknown as { __measure: () => void }).__measure = measure
}

export const remeasure = () => (window as unknown as { __measure?: () => void }).__measure?.()
