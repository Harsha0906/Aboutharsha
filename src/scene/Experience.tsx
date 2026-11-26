import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import Avatar from './Avatar3D'
import { pointer, scroll } from '../state'
import { smoothDamp } from '../motion'

type Stop = {
  pos: [number, number, number]
  look: [number, number, number]
}

// 8 distinct, dynamic 3D camera stops for each portfolio section:
// 0: Hero       - Centered welcoming portrait (straight-on, eye-level)
// 1: About      - Sweeps RIGHT & low-angle (avatar framed comfortably on the LEFT)
// 2: Journey    - Sweeps HIGH & ZOOMS CLOSER (intimate 3/4 storytelling angle)
// 3: Projects   - Sweeps LEFT & PULLS BACK WIDE (large viewing space for project gallery)
// 4: Playground - DIPS LOW & RIGHT with dynamic upward tilt (playful, energetic gaming angle)
// 5: Badges     - RISES HIGH & CENTER-LEFT (dignified elevated overview for certificates)
// 6: Skills     - DEEP PAN LEFT & MEDIUM-CLOSE (avatar on the RIGHT, surveying toolbox on left)
// 7: Contact    - DESCENDS TO CENTER (intimate, warm closing hero portrait)
const DESKTOP: Stop[] = [
  { pos: [0, 0, 7.8], look: [0, 0, 0] },              // 0: Hero (Center)
  { pos: [2.3, 0.3, 6.8], look: [1.4, 0.25, 0] },     // 1: About (Pan Right & Low)
  { pos: [1.8, 0.85, 5.6], look: [1.1, 0.65, 0] },    // 2: Journey (High & Close Zoom)
  { pos: [-1.2, 0.6, 8.8], look: [-0.6, 0.3, 0] },    // 3: Projects (Pan Left & Pull Back Wide)
  { pos: [1.4, -0.15, 7.4], look: [0.7, 0.2, 0] },    // 4: Playground (Dip Low & Right, Upward Tilt)
  { pos: [-0.8, 0.95, 8.0], look: [-0.35, 0.55, 0] }, // 5: Badges (Rise High & Left)
  { pos: [-2.4, 0.35, 6.6], look: [-1.55, 0.25, 0] }, // 6: Skills (Deep Pan Left, Avatar on Right)
  { pos: [0, 0.05, 7.5], look: [0, -0.1, 0] },        // 7: Contact (Smooth Descent to Center)
]

const MOBILE: Stop[] = [
  { pos: [0, 0.1, 8.8], look: [0, -0.2, 0] },
  { pos: [0.35, 0.35, 9.2], look: [0.15, 0.1, 0] },
  { pos: [0.3, 0.6, 8.5], look: [0.15, 0.35, 0] },
  { pos: [-0.3, 0.5, 9.6], look: [-0.15, 0.2, 0] },
  { pos: [0.3, 0.1, 9.0], look: [0.15, 0.15, 0] },
  { pos: [-0.25, 0.65, 9.2], look: [-0.1, 0.3, 0] },
  { pos: [-0.35, 0.4, 8.8], look: [-0.15, 0.15, 0] },
  { pos: [0, 0.15, 8.8], look: [0, -0.25, 0] },
]

// One cinematic camera path through the section stops.
// Position and look-at each follow a centripetal Catmull-Rom curve. Within each segment the camera
// holds on the stop for the first and last 15% of the scroll and glides in between (smootherstep,
// so velocity is continuous). Arc-length mapping keeps the glide speed even between stops.
const HOLD = 0.15
const DIVS_PER_SEG = 48
const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

/** arc-length fraction (0..1) of the curve at each stop */
function stopFractions(curve: THREE.CatmullRomCurve3, segs: number) {
  const lengths = curve.getLengths(segs * DIVS_PER_SEG)
  const total = lengths[lengths.length - 1] || 1
  return Array.from({ length: segs + 1 }, (_, i) => lengths[i * DIVS_PER_SEG] / total)
}

/** section progress (fractional stop index) -> arc-length fraction with holds at each stop */
function pathFraction(t: number, fr: number[]) {
  const segs = fr.length - 1
  const tc = THREE.MathUtils.clamp(t, 0, segs)
  const i = Math.min(segs - 1, Math.floor(tc))
  const f = tc - i
  const g = f <= HOLD ? 0 : f >= 1 - HOLD ? 1 : smootherstep((f - HOLD) / (1 - 2 * HOLD))
  return fr[i] + (fr[i + 1] - fr[i]) * g
}

function Rig() {
  const { camera, size } = useThree()
  const desktop = size.width >= 768
  const stops = desktop ? DESKTOP : MOBILE

  const path = useMemo(() => {
    const pos = new THREE.CatmullRomCurve3(stops.map((s) => new THREE.Vector3(...s.pos)), false, 'centripetal', 0.5)
    const look = new THREE.CatmullRomCurve3(stops.map((s) => new THREE.Vector3(...s.look)), false, 'centripetal', 0.5)
    return { pos, look, posFr: stopFractions(pos, stops.length - 1), lookFr: stopFractions(look, stops.length - 1) }
  }, [stops])

  // all per-frame state is preallocated: no allocations inside useFrame
  const v = useMemo(
    () => ({
      rawPos: new THREE.Vector3(),
      rawLook: new THREE.Vector3(),
      px: { x: stops[0].pos[0], v: 0 },
      py: { x: stops[0].pos[1], v: 0 },
      pz: { x: stops[0].pos[2], v: 0 },
      lx: { x: stops[0].look[0], v: 0 },
      ly: { x: stops[0].look[1], v: 0 },
      lz: { x: stops[0].look[2], v: 0 },
      mx: 0,
      my: 0,
      look: new THREE.Vector3(),
    }),
    [stops],
  )

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    // scroll.smooth is already critically damped (~0.3 s) in motion.ts; never use raw scroll here
    const t = scroll.smooth
    path.pos.getPointAt(pathFraction(t, path.posFr), v.rawPos)
    path.look.getPointAt(pathFraction(t, path.lookFr), v.rawLook)

    // mouse parallax: up to ±0.15 units toward the cursor, eases back to centre when it leaves (desktop only)
    const tx = desktop && pointer.active ? pointer.x * 0.15 : 0
    const ty = desktop && pointer.active ? pointer.y * 0.15 : 0
    v.mx = THREE.MathUtils.damp(v.mx, tx, 2.5, dt)
    v.my = THREE.MathUtils.damp(v.my, ty, 2.5, dt)

    // position and look-at target are damped separately (short, critically damped)
    camera.position.set(
      smoothDamp(v.px, v.rawPos.x, 0.12, dt) + v.mx,
      smoothDamp(v.py, v.rawPos.y, 0.12, dt) + v.my,
      smoothDamp(v.pz, v.rawPos.z, 0.12, dt),
    )
    v.look.set(smoothDamp(v.lx, v.rawLook.x, 0.16, dt), smoothDamp(v.ly, v.rawLook.y, 0.16, dt), smoothDamp(v.lz, v.rawLook.z, 0.16, dt))
    camera.lookAt(v.look)
  })

  return null
}

// Plain warm paper behind the scene. THREE.Color converts the sRGB hex to linear and the renderer
// converts it back on output; the clear colour is not tone-mapped, so the screen reads exactly #EFECE6.
const PAPER = '#efece6'

export default function Experience({ onReady }: { onReady?: () => void }) {
  const lowPower = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4
  return (
    <Canvas
      dpr={[1, lowPower ? 1.25 : 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 7.8], fov: 34, near: 0.1, far: 60 }}
    >
      <AdaptiveDpr pixelated={false} />
      <color attach="background" args={[PAPER]} />
      <Suspense fallback={null}>
        <Avatar />
        <Ready onReady={onReady} />
      </Suspense>
      <Rig />
      {/* Clean, natural neutral lighting without artificial rim colors or glow */}
      <hemisphereLight args={['#ffffff', '#666666', 1.1]} />
      <directionalLight position={[1.5, 3, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-2.5, 1.5, 4]} intensity={0.8} color="#ffffff" />
    </Canvas>
  )
}

function Ready({ onReady }: { onReady?: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (!done.current) {
      done.current = true
      requestAnimationFrame(() => onReady?.())
    }
  })
  return null
}
