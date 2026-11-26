import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { pointer } from '../state'

// A soft iridescent glow that sits behind the avatar's head: a slowly turning conic gradient of
// pastel foil colours with a wide gaussian falloff (the 3D version of a ~60px CSS blur).
// It lives inside the avatar's group, so it always stays behind the head and never washes it out.

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

// Colours are written as sRGB straight to the screen (no tone mapping, no colour conversion),
// so the pastels match their hex values.
const FRAG = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;
const vec3 LILAC = vec3(0.788, 0.714, 1.0);   // #c9b6ff
const vec3 AQUA  = vec3(0.624, 0.890, 0.878); // #9fe3e0
const vec3 PINK  = vec3(1.0, 0.761, 0.863);   // #ffc2dc
const vec3 GOLD  = vec3(1.0, 0.906, 0.659);   // #ffe7a8

vec3 foil(float t) {
  t = fract(t) * 4.0;
  vec3 c = mix(LILAC, AQUA, smoothstep(0.0, 1.0, t));
  c = mix(c, PINK, smoothstep(1.0, 2.0, t));
  c = mix(c, GOLD, smoothstep(2.0, 3.0, t));
  return mix(c, LILAC, smoothstep(3.0, 4.0, t));
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float a = atan(p.y, p.x) / 6.28318530718;
  // conic sweep, gently swirled with the radius so the bands don't look like pie slices
  vec3 col = foil(a + uTime * 0.035 + r * 0.35);
  float alpha = exp(-r * r * 4.2) * smoothstep(1.0, 0.82, r) * uOpacity;
  gl_FragColor = vec4(col, alpha);
}`

export default function HoloGlow({ headY, size }: { headY: number; size: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const offset = useRef({ x: 0, y: 0 })
  const { camera, viewport } = useThree()
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0.55 } }), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((s, dt) => {
    const m = mesh.current
    if (!m) return
    const t = s.clock.elapsedTime
    if (reduced) {
      m.position.set(0, headY, -1.1)
      return
    }
    uniforms.uTime.value = t

    // slow drift (one lap roughly every 20 s)
    const w = (Math.PI * 2) / 20
    const driftX = Math.sin(t * w) * 0.18
    const driftY = Math.cos(t * w * 0.8) * 0.1

    // ease about 10% of the way from the head toward the cursor
    const vp = viewport.getCurrentViewport(camera, m.getWorldPosition(tmp))
    const cx = pointer.active ? pointer.x * vp.width * 0.5 * 0.1 : 0
    const cy = pointer.active ? pointer.y * vp.height * 0.5 * 0.1 : 0
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 2.5)
    offset.current.x += (cx - offset.current.x) * k
    offset.current.y += (cy - offset.current.y) * k

    m.position.set(driftX + offset.current.x, headY + driftY + offset.current.y, -1.1)
  })

  return (
    <mesh ref={mesh} position={[0, headY, -1.1]} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
