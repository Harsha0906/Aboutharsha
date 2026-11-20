import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import Avatar from './Avatar3D'
import Props from './Props'
import { scroll } from '../state'
import { startAsciiSky } from '../ui/AsciiSky'

type Stop = { pos: [number, number, number]; look: [number, number, number] }

// One camera stop per section (same order as `sections` in data/profile.ts).
const DESKTOP: Stop[] = [
  { pos: [0, 0.1, 8.4], look: [0, -0.75, 0] }, // hello: face high, title over the chest
  { pos: [2.5, 0.55, 6.6], look: [1.7, 0.35, 0] }, // about: avatar on the left
  { pos: [2.6, 1.0, 5.0], look: [1.45, 0.65, 0] }, // experience: closer on the face
  { pos: [-3.4, 0.4, 8.6], look: [-3.0, 0.1, 0] }, // projects: avatar far right, dimmed
  { pos: [3.4, 0.3, 8.6], look: [3.0, 0.0, 0] }, // playground: avatar far left
  { pos: [-3.2, 0.7, 8.2], look: [-2.8, 0.4, 0] }, // certificates
  { pos: [-2.4, 0.8, 6.4], look: [-1.6, 0.5, 0] }, // skills: avatar on the right
  { pos: [0, 0.2, 8.0], look: [0, -0.95, 0] }, // contact: face high, text below
]

const MOBILE: Stop[] = DESKTOP.map((s, i) => ({
  pos: [s.pos[0] * 0.25, 0.2 + (i ? 0.2 : 0), 9.6 + (i ? 0.6 : 0)],
  look: [0, i ? -0.6 : -0.5, 0],
}))

const ease = (x: number, hold = 0.3) => {
  // hold on each stop for a while, then glide to the next
  const k = THREE.MathUtils.clamp((x - hold) / (1 - hold), 0, 1)
  return k * k * (3 - 2 * k)
}

function Rig() {
  const { camera, size } = useThree()
  const stops = size.width < 760 ? MOBILE : DESKTOP
  const pos = useMemo(() => new THREE.Vector3(...stops[0].pos), [stops])
  const look = useMemo(() => new THREE.Vector3(...stops[0].look), [stops])
  const curLook = useRef(new THREE.Vector3(...stops[0].look))
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])

  useFrame((s, dt) => {
    const t = THREE.MathUtils.clamp(scroll.t, 0, stops.length - 1)
    const i = Math.floor(t)
    const j = Math.min(stops.length - 1, i + 1)
    // the hero holds the camera still while the avatar rises on its own
    const k = ease(t - i, i === 0 ? 0.74 : 0.3)
    pos.lerpVectors(a.set(...stops[i].pos), b.set(...stops[j].pos), k)
    look.lerpVectors(a.set(...stops[i].look), b.set(...stops[j].look), k)
    // a touch of handheld drift
    const tm = s.clock.elapsedTime
    pos.x += Math.sin(tm * 0.21) * 0.05
    pos.y += Math.sin(tm * 0.17) * 0.04
    const damp = 1 - Math.exp(-dt * 3.2)
    camera.position.lerp(pos, damp)
    curLook.current.lerp(look, damp)
    camera.lookAt(curLook.current)
  })
  return null
}

// The ASCII sky lives in a 2D canvas and is shown as the scene background.
function SkyBackground() {
  const { scene } = useThree()
  const tex = useMemo(() => {
    const sky = startAsciiSky()
    const t = new THREE.CanvasTexture(sky.canvas!)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    t.generateMipmaps = false
    return t
  }, [])
  const seen = useRef(-1)
  useEffect(() => {
    scene.background = tex
    return () => { scene.background = null }
  }, [scene, tex])
  useFrame(() => {
    const sky = startAsciiSky()
    if (sky.frame !== seen.current) {
      seen.current = sky.frame
      if (tex.image !== sky.canvas) tex.image = sky.canvas
      tex.needsUpdate = true
    }
  })
  return null
}

function Effects() {
  // no depth of field: the ASCII clouds stay crisp
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={0.25} luminanceThreshold={0.85} mipmapBlur />
      <Vignette offset={0.3} darkness={0.45} />
      <SMAA />
    </EffectComposer>
  )
}

export default function Experience({ onReady }: { onReady?: () => void }) {
  const lowPower = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4
  return (
    <Canvas
      dpr={[1, lowPower ? 1.25 : 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      camera={{ position: DESKTOP[0].pos, fov: 34, near: 0.1, far: 60 }}
    >
      <AdaptiveDpr pixelated={false} />
      <SkyBackground />
      <Rig />
      <hemisphereLight args={['#fff7ea', '#8fb0cc', 1.5]} />
      <directionalLight position={[-3, 4, 5]} intensity={2.4} color="#fff1dc" />
      <directionalLight position={[4, 1, 3]} intensity={0.5} color="#dfe8ff" />
      {/* rim lights from behind: a warm and a cool edge that lift the avatar off the sky */}
      <directionalLight position={[3.5, 2.5, -4]} intensity={3.2} color="#ffd9a8" />
      <directionalLight position={[-3.5, 1.5, -4]} intensity={2.4} color="#cfe8ff" />
      <Suspense fallback={null}>
        <Environment resolution={64}>
          <Lightformer intensity={1.4} position={[0, 4, 4]} scale={[8, 3, 1]} color="#fff4e2" />
          <Lightformer intensity={0.6} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} color="#dfe9d0" />
          <Lightformer intensity={0.4} position={[5, -1, 1]} rotation-y={-Math.PI / 2} scale={[6, 4, 1]} color="#cfd9ff" />
        </Environment>
        <Avatar />
        <Props />
        <Ready onReady={onReady} />
      </Suspense>
      <Effects />
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
