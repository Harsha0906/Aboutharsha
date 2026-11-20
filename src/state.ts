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
    const y = window.scrollY + window.innerHeight * 0.45
    const tops = els.map((el) => el.offsetTop)
    let t = 0
    for (let i = 0; i < tops.length; i++) {
      const next = tops[i + 1] ?? tops[i] + els[i].offsetHeight
      if (y >= tops[i]) t = i + Math.min(1, (y - tops[i]) / Math.max(1, next - tops[i]))
    }
    scroll.t = Math.min(t, tops.length - 1)
    const max = document.documentElement.scrollHeight - window.innerHeight
    scroll.p = max > 0 ? window.scrollY / max : 0
  }
  window.addEventListener('scroll', measure, { passive: true })
  window.addEventListener('resize', measure)
  ;(window as unknown as { __measure: () => void }).__measure = measure
}

export const remeasure = () => (window as unknown as { __measure?: () => void }).__measure?.()
