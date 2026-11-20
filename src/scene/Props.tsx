import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff?url'
import { scroll } from '../state'

// Hand-modelled "clay" props, one per section, floating around the avatar.
// Each prop drifts in and scales up while its section is on screen.

const clay = (color: string) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.78, sheen: 0.6, sheenRoughness: 0.8, sheenColor: '#ffffff' })

const C = {
  cream: clay('#efe4d0'),
  terracotta: clay('#d9825f'),
  blue: clay('#7f9cc6'),
  mustard: clay('#e2b24e'),
  ink: clay('#2f3136'),
  sage: clay('#8ea476'),
  pink: clay('#e48f9e'),
  white: clay('#fbf6ec'),
  red: clay('#cf5b52'),
}

function Floating({
  section,
  base,
  focus,
  children,
  spin = 0.25,
  scale = 1,
}: {
  section: number
  base: [number, number, number]
  focus: [number, number, number]
  children: ReactNode
  spin?: number
  scale?: number
}) {
  const ref = useRef<THREE.Group>(null)
  const seed = useMemo(() => Math.random() * 10, [])
  const a = useMemo(() => new THREE.Vector3(...base), [base])
  const b = useMemo(() => new THREE.Vector3(...focus), [focus])
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame((s, dt) => {
    const g = ref.current
    if (!g) return
    const t = s.clock.elapsedTime + seed
    const k = Math.max(0, 1 - Math.abs(scroll.t - section) / 0.85)
    const e = k * k * (3 - 2 * k)
    v.lerpVectors(a, b, e)
    v.y += Math.sin(t * 0.9) * 0.08
    g.position.lerp(v, 1 - Math.exp(-dt * 6))
    // props stay hidden during the hero, so the avatar's rise is the only thing moving
    const ap = THREE.MathUtils.smoothstep(scroll.t, 0.85, 1.25)
    g.visible = ap > 0.001
    const sc = scale * (0.75 + 0.45 * e) * ap
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, sc, 5, dt))
    g.rotation.y = Math.sin(t * spin) * 0.5 + e * 0.2
    g.rotation.x = Math.sin(t * 0.6) * 0.08
    g.rotation.z = Math.cos(t * 0.5) * 0.06
  })
  return <group ref={ref} position={base}>{children}</group>
}

function Laptop() {
  const bars = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: -0.42 + (i % 3) * 0.06,
        w: 0.25 + ((i * 37) % 5) * 0.09,
        y: 0.28 - i * 0.085,
        c: ['#e2b24e', '#7fb8a4', '#e48f9e', '#8fa4d8'][i % 4],
      })),
    [],
  )
  return (
    <group rotation={[0.25, -0.5, 0]}>
      <RoundedBox args={[1.4, 0.08, 0.95]} radius={0.04} material={C.cream} />
      <RoundedBox args={[1.0, 0.012, 0.32]} position={[0, 0.045, -0.1]} radius={0.005} material={C.sage} />
      <group position={[0, 0.02, -0.47]} rotation={[-0.32, 0, 0]}>
        <RoundedBox args={[1.4, 0.92, 0.06]} position={[0, 0.46, 0]} radius={0.04} material={C.cream} />
        <mesh position={[0, 0.46, 0.032]}>
          <planeGeometry args={[1.22, 0.76]} />
          <meshBasicMaterial color="#23262b" toneMapped={false} />
        </mesh>
        {bars.map((b, i) => (
          <mesh key={i} position={[b.x + b.w / 2, 0.46 + b.y, 0.036]}>
            <planeGeometry args={[b.w, 0.035]} />
            <meshBasicMaterial color={b.c} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Controller() {
  return (
    <group rotation={[0.5, 0.3, -0.1]}>
      <RoundedBox args={[1.2, 0.46, 0.34]} radius={0.17} smoothness={6} material={C.terracotta} />
      <mesh position={[-0.5, -0.2, 0]} scale={[0.26, 0.36, 0.18]} material={C.terracotta}>
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>
      <mesh position={[0.5, -0.2, 0]} scale={[0.26, 0.36, 0.18]} material={C.terracotta}>
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>
      <RoundedBox args={[0.24, 0.07, 0.06]} position={[-0.33, 0.03, 0.18]} radius={0.025} material={C.cream} />
      <RoundedBox args={[0.07, 0.24, 0.06]} position={[-0.33, 0.03, 0.18]} radius={0.025} material={C.cream} />
      {[
        [0.33, 0.12, C.mustard],
        [0.43, 0.03, C.blue],
        [0.23, 0.03, C.pink],
        [0.33, -0.06, C.sage],
      ].map(([x, y, m], i) => (
        <mesh key={i} position={[x as number, y as number, 0.17]} material={m as THREE.Material}>
          <sphereGeometry args={[0.045, 24, 24]} />
        </mesh>
      ))}
    </group>
  )
}

function Medal() {
  const star = useMemo(() => {
    const s = new THREE.Shape()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.1 : 0.22
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2
      const p = [Math.cos(a) * r, Math.sin(a) * r] as const
      if (i) s.lineTo(...p)
      else s.moveTo(...p)
    }
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 4 })
  }, [])
  return (
    <group rotation={[0.1, -0.3, 0.12]}>
      <RoundedBox args={[0.22, 0.75, 0.04]} position={[-0.17, 0.55, -0.04]} rotation={[0, 0, -0.35]} radius={0.015} material={C.blue} />
      <RoundedBox args={[0.22, 0.75, 0.04]} position={[0.17, 0.55, -0.05]} rotation={[0, 0, 0.35]} radius={0.015} material={C.red} />
      <mesh rotation={[Math.PI / 2, 0, 0]} material={C.mustard}>
        <cylinderGeometry args={[0.42, 0.42, 0.1, 48]} />
      </mesh>
      <mesh position={[0, 0, 0.04]} material={C.white}>
        <torusGeometry args={[0.34, 0.025, 12, 48]} />
      </mesh>
      <mesh geometry={star} position={[0, 0, 0.04]} material={C.white} />
    </group>
  )
}

function Keycaps() {
  const keys = [
    { ch: '<', p: [-0.32, 0.05, 0], m: C.cream, r: -0.2 },
    { ch: '/', p: [0.12, 0.18, 0.1], m: C.mustard, r: 0.15 },
    { ch: '>', p: [0.5, -0.05, -0.05], m: C.sage, r: 0.3 },
    { ch: '{}', p: [0.05, -0.38, 0.12], m: C.blue, r: -0.1 },
  ] as const
  return (
    <group rotation={[0.35, 0.2, 0]}>
      {keys.map((k, i) => (
        <group key={i} position={k.p as unknown as [number, number, number]} rotation={[0, 0, k.r]}>
          <RoundedBox args={[0.38, 0.38, 0.22]} radius={0.07} smoothness={5} material={k.m} />
          <Text font={monoFont} fontSize={0.17} position={[0, 0.01, 0.115]} color="#2f3136" anchorX="center" anchorY="middle">
            {k.ch}
          </Text>
        </group>
      ))}
    </group>
  )
}

function PaperPlane() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    // nose, left wing tip, right wing tip, tail center, keel
    const v = [0, 0, 0.7, -0.45, 0.02, -0.4, 0.45, 0.02, -0.4, 0, 0.05, -0.32, 0, -0.16, -0.36]
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
    g.setIndex([0, 1, 3, 0, 3, 2, 0, 4, 3, 0, 3, 4])
    g.computeVertexNormals()
    return g
  }, [])
  const mat = useMemo(() => {
    const m = C.white.clone()
    m.side = THREE.DoubleSide
    m.flatShading = true
    return m
  }, [])
  return <mesh geometry={geo} material={mat} rotation={[0.3, 0.8, 0.2]} />
}

export default function Props() {
  return (
    <>
      <Floating section={3} base={[-3.4, -1.6, 0.6]} focus={[-2.45, -1.15, 1.4]} spin={0.2}>
        <Laptop />
      </Floating>
      <Floating section={4} base={[3.5, -1.3, 0.8]} focus={[2.45, -0.8, 1.6]}>
        <Controller />
      </Floating>
      <Floating section={5} base={[-3.6, 0.9, -0.4]} focus={[-2.35, 0.75, 1.3]} spin={0.35}>
        <Medal />
      </Floating>
      <Floating section={6} base={[3.3, 1.5, 0.3]} focus={[2.35, 0.8, 1.4]}>
        <Keycaps />
      </Floating>
      <Floating section={7} base={[3.4, 2.8, -1.2]} focus={[2.3, 1.7, 0.4]} spin={0.4} scale={0.6}>
        <PaperPlane />
      </Floating>
    </>
  )
}
