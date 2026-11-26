// One animation loop for everything that follows the scroll:
//  - Lenis inertial smooth scrolling (wheel only; touch stays native)
//  - a critically damped copy of the section progress (scroll.smooth) that the camera and
//    the section reveals both read, so text and camera always arrive together
//  - the section reveals themselves (opacity + translateY only)
import Lenis from 'lenis'
import { scroll } from './state'

/**
 * Critically damped spring toward `target` (the classic "smooth damp").
 * `smoothTime` is roughly the lag in seconds. Velocity is kept in `state.v`, so motion is C1:
 * no snaps when the target jumps.
 */
export function smoothDamp(state: { x: number; v: number }, target: number, smoothTime: number, dt: number) {
  const omega = 2 / Math.max(0.0001, smoothTime)
  const x = omega * dt
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = state.x - target
  const temp = (state.v + omega * change) * dt
  state.v = (state.v - omega * temp) * exp
  state.x = target + (change + temp) * exp
  return state.x
}

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export let lenis: Lenis | null = null

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Smooth-scroll to a section (or any element / y position). Falls back to native scrolling. */
export function scrollToTarget(target: string | HTMLElement | number) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, easing: easeInOut })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduced ? 'auto' : 'smooth' })
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }
}

// ---------- section reveals ----------
type RevealItem = { el: HTMLElement; stop: number; order: number; last: number }
const reveals = new Set<RevealItem>()

/** Register an element whose opacity/translate follow the camera's arrival at its section. */
export function registerReveal(el: HTMLElement, order: number) {
  const host = el.closest('[data-stop]')
  const stops = Array.from(document.querySelectorAll('[data-stop]'))
  const item: RevealItem = { el, stop: Math.max(0, stops.indexOf(host as Element)), order, last: -1 }
  reveals.add(item)
  applyReveal(item)
  return () => {
    reveals.delete(item)
  }
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

function applyReveal(item: RevealItem) {
  // distance of the damped camera progress from this section's stop
  const d = scroll.smooth - item.stop
  // ease in as the camera arrives (staggered ~60 ms per element at a normal scroll pace)…
  const lag = item.order * 0.045
  const enter = smoother(clamp01((d + 0.6 - lag) / 0.45))
  // …and out as it leaves for the next stop (the last section never leaves)
  const isLast = item.stop >= scroll.stops - 1
  const exit = isLast ? 1 : 1 - smoother(clamp01((d - 0.88) / 0.3))
  let v = reduced ? 1 : Math.min(enter, exit)
  v = Math.round(v * 1000) / 1000
  if (v === item.last) return
  item.last = v
  const s = item.el.style
  if (v >= 1) {
    s.opacity = ''
    s.transform = ''
  } else {
    s.opacity = String(v)
    s.transform = `translate3d(0, ${((1 - v) * 40).toFixed(2)}px, 0)`
  }
}

// ---------- the loop ----------
if (typeof window !== 'undefined') {
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true, syncTouch: false, autoRaf: false })
  }

  // in-page links (#about, nav dots, scroll cue) glide with the same easing
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
    if (!a) return
    const id = a.getAttribute('href')!
    if (id.length < 2) return
    const el = document.querySelector<HTMLElement>(id)
    if (!el) return
    e.preventDefault()
    scrollToTarget(el)
    history.replaceState(null, '', id)
  })

  const progress = { x: 0, v: 0 }
  let prev = performance.now()
  let stopped = false
  const frame = (now: number) => {
    const dt = Math.min(0.1, Math.max(0, (now - prev) / 1000))
    prev = now
    if (lenis) {
      // let the game modal (and anything else that locks the page) take the wheel
      const locked = document.body.classList.contains('modal-open')
      if (locked !== stopped) {
        stopped = locked
        locked ? lenis.stop() : lenis.start()
      }
      lenis.raf(now)
    }
    scroll.smooth = reduced ? scroll.t : smoothDamp(progress, scroll.t, 0.3, dt)
    for (const r of reveals) applyReveal(r)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
